import os
from typing import List, Dict, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

class InventoryService:
    CATEGORIES = [
        'vegetables', 'fruits', 'meat', 'seafood', 'dairy',
        'grains', 'condiments', 'beverages', 'snacks',
        'frozen', 'canned', 'other'
    ]
    
    def __init__(self, family_id: str = "00000000-0000-0000-0000-000000000001"):
        load_dotenv()
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('ANON_PUBLIC_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing SUPABASE_URL or ANON_PUBLIC_KEY in environment variables")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        self.family_id = family_id
    
    def get_inventory(self) -> List[Dict]:
        """Fetch all inventory items for the family"""
        try:
            response = self.client.table('inventory_items').select('*').eq('family_id', self.family_id).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching inventory: {e}")
            return []
    
    def format_inventory_for_prompt(self) -> str:
        """Format inventory for LLM prompt"""
        inventory = self.get_inventory()
        
        if not inventory:
            return "No items currently in inventory."
        
        lines = []
        for item in inventory:
            name = item['name']
            category = item['category']
            quantity = item['quantity']
            lines.append(f"- {name} ({category}): {quantity}")
        
        return "\n".join(lines)
    
    def get_item_by_name(self, name: str) -> Optional[Dict]:
        """Get specific item from inventory by name"""
        try:
            response = self.client.table('inventory_items').select('*').eq('family_id', self.family_id).eq('name', name).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"Error fetching item {name}: {e}")
            return None
    
    def upsert_item(self, name: str, category: str, quantity_delta: float) -> bool:
        """Update existing item or insert new one"""
        try:
            existing_item = self.get_item_by_name(name)
            
            if existing_item:
                new_quantity = float(existing_item['quantity']) + quantity_delta
                new_quantity = max(0, new_quantity)
                
                self.client.table('inventory_items').update({
                    'quantity': new_quantity
                }).eq('id', existing_item['id']).execute()
                
                print(f"Updated {name}: {existing_item['quantity']} → {new_quantity}")
            else:
                if quantity_delta > 0:
                    self.client.table('inventory_items').insert({
                        'family_id': self.family_id,
                        'name': name,
                        'category': category,
                        'quantity': quantity_delta
                    }).execute()
                    
                    print(f"Created new item {name} ({category}): {quantity_delta}")
                else:
                    print(f"Cannot create {name} with negative quantity")
                    return False
            
            return True
        except Exception as e:
            print(f"Error upserting item {name}: {e}")
            return False
    
    def apply_action(self, action_type: str, name: str, category: str, quantity: float) -> bool:
        """Apply PUT or TAKEN action to inventory"""
        if action_type == "PUT":
            return self.upsert_item(name, category, quantity)
        elif action_type == "TAKEN":
            return self.upsert_item(name, category, -quantity)
        else:
            print(f"Unknown action type: {action_type}")
            return False


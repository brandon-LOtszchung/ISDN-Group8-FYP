from typing import List, Dict, Optional
import logging
from src.services.supabase_service import SupabaseService
from src.services.initialization_service import normalize_category

logger = logging.getLogger(__name__)

class InventoryService(SupabaseService):
    CATEGORIES = [
        'Protein', 'Vegetable', 'Fruit', 'Dairy',
        'Grain', 'Condiment', 'Beverage', 'Other',
    ]
    
    def __init__(self, family_id: str = "eef3fcba-7b07-4c18-82dc-50dfe60b97ac"):
        super().__init__(family_id=family_id)
    
    def get_inventory(self) -> List[Dict]:
        try:
            response = self.client.table('inventory_items').select('*').eq('family_id', self.family_id).execute()
            return response.data
        except Exception as e:
            logger.exception("Error fetching inventory: %s", e)
            return []
    
    def format_inventory_for_prompt(self) -> str:
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
        try:
            response = self.client.table('inventory_items').select('*').eq('family_id', self.family_id).eq('name', name).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.exception("Error fetching item %s: %s", name, e)
            return None
    
    def upsert_item(self, name: str, category: str, quantity_delta: float) -> bool:
        try:
            existing_item = self.get_item_by_name(name)

            if existing_item:
                new_quantity = float(existing_item['quantity']) + quantity_delta
                new_quantity = max(0, new_quantity)
                logger.info(
                    "upsert UPDATE family=%s name=%s old_qty=%s delta=%s new_qty=%s",
                    self.family_id, name, existing_item['quantity'], quantity_delta, new_quantity,
                )
                self.client.table('inventory_items').update({
                    'quantity': new_quantity
                }).eq('id', existing_item['id']).execute()
            else:
                if quantity_delta > 0:
                    logger.info(
                        "upsert INSERT family=%s name=%s category=%s qty=%s",
                        self.family_id, name, normalize_category(category), quantity_delta,
                    )
                    self.client.table('inventory_items').insert({
                        'family_id': self.family_id,
                        'name': name,
                        'category': normalize_category(category),
                        'quantity': quantity_delta
                    }).execute()
                else:
                    logger.warning(
                        "upsert SKIP family=%s name=%s — TAKEN from empty/unknown item (delta=%s); "
                        "cannot create row with non-positive quantity",
                        self.family_id, name, quantity_delta,
                    )
                    return False

            return True
        except Exception as e:
            logger.exception("upsert ERROR family=%s name=%s: %s", self.family_id, name, e)
            return False

    def apply_action(self, action_type: str, name: str, category: str, quantity: float) -> bool:
        logger.info("apply_action %s name=%s category=%s qty=%s", action_type, name, category, quantity)
        if action_type == "PUT":
            return self.upsert_item(name, category, quantity)
        elif action_type == "TAKEN":
            return self.upsert_item(name, category, -quantity)
        else:
            logger.warning("apply_action unknown type=%s for name=%s", action_type, name)
            return False


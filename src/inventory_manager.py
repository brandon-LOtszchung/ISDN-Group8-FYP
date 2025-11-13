from typing import List, Dict, Optional
from datetime import datetime
import json
import os


class InventoryManager:
    """Manages fridge inventory with consistent item naming and persistence."""
    
    def __init__(self, inventory_file: Optional[str] = None):
        """
        Args:
            inventory_file: Path to JSON file for inventory persistence
        """
        self.items: List[Dict] = []
        self.inventory_file = inventory_file
        
        if inventory_file and os.path.exists(inventory_file):
            self.load(inventory_file)
    
    def add_item(self, item_name: str, quantity: int):
        """
        Args:
            item_name: Name of the item
            quantity: Number of items to add
        """
        for _ in range(quantity):
            self.items.append({
                "name": item_name,
                "added_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
        
        if self.inventory_file:
            self.save()
    
    def remove_item(self, item_name: str, quantity: int = 1):
        """
        Args:
            item_name: Name of the item to remove
            quantity: Number of items to remove
        
        Returns:
            Number of items actually removed
        """
        removed_count = 0
        items_to_keep = []
        
        for item in self.items:
            if item["name"].lower() == item_name.lower() and removed_count < quantity:
                removed_count += 1
            else:
                items_to_keep.append(item)
        
        self.items = items_to_keep
        
        if self.inventory_file:
            self.save()
        
        return removed_count
    
    def get_inventory_list(self) -> List[str]:
        """
        Returns:
            List of unique item names currently in inventory
        """
        unique_items = {}
        for item in self.items:
            name = item["name"]
            unique_items[name] = unique_items.get(name, 0) + 1
        
        return [f"{count}x {name}" for name, count in unique_items.items()]
    
    def get_total_count(self) -> int:
        """
        Returns:
            Total number of items in inventory
        """
        return len(self.items)
    
    def clear(self):
        """Clear all inventory."""
        self.items = []
        if self.inventory_file:
            self.save()
    
    def save(self, filepath: Optional[str] = None):
        """
        Save inventory to JSON file.
        
        Args:
            filepath: Optional custom filepath (uses default if not provided)
        """
        save_path = filepath or self.inventory_file
        if not save_path:
            return
        
        try:
            os.makedirs(os.path.dirname(save_path) or '.', exist_ok=True)
            with open(save_path, 'w') as f:
                json.dump(self.items, f, indent=2)
        except Exception as e:
            print(f"Error saving inventory: {e}")
    
    def load(self, filepath: Optional[str] = None):
        """
        Load inventory from JSON file.
        
        Args:
            filepath: Optional custom filepath (uses default if not provided)
        """
        load_path = filepath or self.inventory_file
        if not load_path or not os.path.exists(load_path):
            return
        
        try:
            with open(load_path, 'r') as f:
                self.items = json.load(f)
        except Exception as e:
            print(f"Error loading inventory: {e}")
            self.items = []
    
    def export_to_dict(self) -> Dict[str, any]:
        """
        Export inventory as dictionary with metadata.
        
        Returns:
            Dictionary with inventory data and metadata
        """
        return {
            'items': self.items,
            'total_count': len(self.items),
            'unique_items': len(set(item['name'] for item in self.items)),
            'exported_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    def import_from_dict(self, data: Dict[str, any]):
        """
        Import inventory from dictionary.
        
        Args:
            data: Dictionary with inventory data
        """
        if 'items' in data:
            self.items = data['items']
            if self.inventory_file:
                self.save()


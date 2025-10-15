from typing import List, Dict
from datetime import datetime


class InventoryManager:
    """Manages fridge inventory with consistent item naming."""
    
    def __init__(self):
        self.items: List[Dict] = []
    
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
    
    def remove_item(self, item_name: str, quantity: int = 1):
        """
        Args:
            item_name: Name of the item to remove
            quantity: Number of items to remove
        """
        removed_count = 0
        items_to_keep = []
        
        for item in self.items:
            if item["name"].lower() == item_name.lower() and removed_count < quantity:
                removed_count += 1
            else:
                items_to_keep.append(item)
        
        self.items = items_to_keep
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


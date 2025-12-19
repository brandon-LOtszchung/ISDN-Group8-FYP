import cv2
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from services.video_processor import VideoProcessor
from services.image_analyzer import ImageAnalyzer
from services.inventory_service import InventoryService

def compare_moments(moment1_items: List[Dict], moment2_items: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
    """
    Compare two moments to determine PUT and TAKEN actions.
    
    Returns:
        Tuple of (put_actions, taken_actions)
        Each action: {"name": str, "quantity": float, "category": str}
    """
    items1_dict = {item['name']: item for item in moment1_items}
    items2_dict = {item['name']: item for item in moment2_items}
    
    all_items = set(items1_dict.keys()) | set(items2_dict.keys())
    
    put_actions = []
    taken_actions = []
    
    for item_name in all_items:
        qty1 = items1_dict.get(item_name, {}).get('quantity', 0)
        qty2 = items2_dict.get(item_name, {}).get('quantity', 0)
        
        diff = qty2 - qty1
        
        if diff > 0:
            put_actions.append({
                'name': item_name,
                'quantity': diff,
                'category': items2_dict[item_name]['category']
            })
        elif diff < 0:
            taken_actions.append({
                'name': item_name,
                'quantity': abs(diff),
                'category': items1_dict[item_name]['category']
            })
    
    return put_actions, taken_actions

def format_actions(put_actions: List[Dict], taken_actions: List[Dict]) -> str:
    """Format actions into readable string"""
    parts = []
    
    if put_actions:
        put_str = ", ".join([f"{a['quantity']}x {a['name']}" for a in put_actions])
        parts.append(f"PUT: {put_str}")
    
    if taken_actions:
        taken_str = ", ".join([f"{a['quantity']}x {a['name']}" for a in taken_actions])
        parts.append(f"TAKEN: {taken_str}")
    
    return " | ".join(parts) if parts else "NO ACTION"

def main(video_path: str):
    if not Path(video_path).exists():
        print(f"Error: Video file not found: {video_path}")
        return
    
    print("Initializing services...")
    inventory_service = InventoryService()
    analyzer = ImageAnalyzer()
    processor = VideoProcessor(red_line_ratio=0.8)
    
    print("Loading current inventory...")
    inventory_context = inventory_service.format_inventory_for_prompt()
    print(f"Inventory loaded:\n{inventory_context}\n")
    
    print(f"Processing video: {video_path}")
    print("-" * 70)
    
    result = processor.process_video(video_path)
    
    if "error" in result:
        print(f"Error: {result['error']}")
        return
    
    if result["moment1"]:
        m1 = result["moment1"]
        print(f"Moment 1 (Hand entering fridge):")
        print(f"  Frame: {m1['frame_index']}")
        print(f"  Sharpness: {m1['sharpness']:.2f}")
        cv2.imwrite("moment1_best_frame.jpg", m1["frame"])
        print(f"  Saved: moment1_best_frame.jpg")
    else:
        print("Moment 1: Not detected")
        return
    
    print()
    
    if result["moment2"]:
        m2 = result["moment2"]
        print(f"Moment 2 (Hand exiting fridge):")
        print(f"  Frame: {m2['frame_index']}")
        print(f"  Sharpness: {m2['sharpness']:.2f}")
        cv2.imwrite("moment2_best_frame.jpg", m2["frame"])
        print(f"  Saved: moment2_best_frame.jpg")
    else:
        print("Moment 2: Not detected")
        return
    
    print()
    print("-" * 70)
    print("Analyzing images with Gemini AI...")
    
    moment1_data = analyzer.analyze_hand("moment1_best_frame.jpg", inventory_context)
    moment2_data = analyzer.analyze_hand("moment2_best_frame.jpg", inventory_context)
    
    moment1_items = moment1_data.get("items", [])
    moment2_items = moment2_data.get("items", [])
    
    print(f"\nMoment 1 (Entering): {moment1_items}")
    print(f"Moment 2 (Exiting): {moment2_items}")
    print()
    
    put_actions, taken_actions = compare_moments(moment1_items, moment2_items)
    
    action_summary = format_actions(put_actions, taken_actions)
    print("-" * 70)
    print(f"ACTION: {action_summary}")
    print("-" * 70)
    
    if not put_actions and not taken_actions:
        print("No database updates needed.")
        return
    
    print("\nUpdating inventory database...")
    
    for action in put_actions:
        success = inventory_service.apply_action(
            "PUT",
            action['name'],
            action['category'],
            action['quantity']
        )
        if not success:
            print(f"  ⚠ Failed to PUT {action['name']}")
    
    for action in taken_actions:
        success = inventory_service.apply_action(
            "TAKEN",
            action['name'],
            action['category'],
            action['quantity']
        )
        if not success:
            print(f"  ⚠ Failed to TAKE {action['name']}")
    
    print("\n✓ Database update complete!")
    print("\nUpdated inventory:")
    print(inventory_service.format_inventory_for_prompt())

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <video_path>")
        sys.exit(1)
    
    main(sys.argv[1])


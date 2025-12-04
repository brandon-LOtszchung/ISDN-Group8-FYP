import cv2
import sys
from pathlib import Path
from video_processor import VideoProcessor
from image_analyzer import ImageAnalyzer

def determine_action(moment1_data: dict, moment2_data: dict):
    item1 = moment1_data.get("item", "nothing")
    qty1 = moment1_data.get("quantity", 0)
    item2 = moment2_data.get("item", "nothing")
    qty2 = moment2_data.get("quantity", 0)
    
    if item1 == "nothing" and item2 != "nothing":
        return f"PUT: {qty2}x {item2}"
    elif item1 != "nothing" and item2 == "nothing":
        return f"TAKEN: {qty1}x {item1}"
    elif item1 != "nothing" and item2 != "nothing" and item1 != item2:
        return f"PUT: {qty1}x {item1}, TAKEN: {qty2}x {item2}"
    else:
        return "NO ACTION"

def main(video_path: str):
    if not Path(video_path).exists():
        print(f"Error: Video file not found: {video_path}")
        return
    
    processor = VideoProcessor(red_line_ratio=0.8)
    result = processor.process_video(video_path)
    
    if "error" in result:
        print(f"Error: {result['error']}")
        return
    
    print(f"Video: {video_path}")
    print("-" * 50)
    
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
    print("-" * 50)
    print("Analyzing images with Gemini...")
    
    analyzer = ImageAnalyzer()
    moment1_data = analyzer.analyze_hand("moment1_best_frame.jpg")
    moment2_data = analyzer.analyze_hand("moment2_best_frame.jpg")
    
    print(f"Moment 1: {moment1_data}")
    print(f"Moment 2: {moment2_data}")
    print()
    
    action = determine_action(moment1_data, moment2_data)
    print(f"ACTION: {action}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <video_path>")
        sys.exit(1)
    
    main(sys.argv[1])


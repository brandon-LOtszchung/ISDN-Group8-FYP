"""Simple logging setup for the application."""
import logging
import sys
from pathlib import Path
from typing import Optional


def setup_logger(
    name: str = "FridgeTracker",
    level: int = logging.INFO,
    log_file: Optional[str] = None,
    console_output: bool = True
) -> logging.Logger:
    """
    Setup application logger.
    
    Args:
        name: Logger name
        level: Logging level
        log_file: Path to log file (optional)
        console_output: Enable console output
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.handlers.clear()
    
    # Simple formatter
    formatter = logging.Formatter(
        '%(levelname)s | %(message)s'
    )
    
    detailed_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    if console_output:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    # File handler
    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(detailed_formatter)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str = "FridgeTracker") -> logging.Logger:
    """Get existing logger."""
    return logging.getLogger(name)

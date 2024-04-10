# Placeholder class (unused)
class NodePresets():
    @classmethod
    def INPUT_TYPES(s):
        return { "required": {} }
    
    RETURN_TYPES = ("*",)
    CATEGORY = "NodePresets"    
    FUNCTION = "func"

NODE_CLASS_MAPPINGS = { "NodePresets": NodePresets }

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "WEB_DIRECTORY"]

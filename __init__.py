# Placeholder class (unused)
class NodePresets():
    @classmethod
    def INPUT_TYPES(s):
        return { "required": {} }
    
    RETURN_TYPES = ("*",)
    CATEGORY = "NodePresets"    
    FUNCTION = "func"

NODE_CLASS_MAPPINGS = { "NodePresets": NodePresets }
NODE_DISPLAY_NAME_MAPPINGS = {"NodePresets" : "NodePresets (Unused)"}
WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]

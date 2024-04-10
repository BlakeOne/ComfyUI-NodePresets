class NodePresets():
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "name": ("STRING", {"name": ""}),
            },
        }
        
    OUTPUT_NODE = True
    FUNCTION = "func"
    CATEGORY = "NodePresets"
    RETURN_TYPES = ("*",)    

NODE_CLASS_MAPPINGS = { "NodePresets": NodePresets }

WEB_DIRECTORY = "./js"

__all__ = ["NODE_CLASS_MAPPINGS", "WEB_DIRECTORY"]

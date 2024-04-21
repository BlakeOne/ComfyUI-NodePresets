import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { ComfyDialog, $el } from "../../scripts/ui.js";

// Adds the ability to save and load node presets using the node's context menu
// To save:
// Right click on the node
// Presets -> Save -> give it a name
//
// To load:
// Right click on the node
// Presets -> click the one to add
//
// To delete/rename:
// Right click the node
// Presets -> Manage
//
// To rearrange:
// Open the manage dialog and Drag and drop elements using the "Name:" label as handle

const id = "Comfy.NodePresets";
const file = "comfy.presets.json";

class PresetManager extends ComfyDialog {
	constructor() {
		super();
		this.load().then((v) => {
			this.presets = v;
		});

		this.element.classList.add("comfy-manage-presets");
		this.draggedEl = null;
		this.saveVisualCue = null;
		this.emptyImg = new Image();
		this.emptyImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

		this.importInput = $el("input", {
			type: "file",
			accept: ".json",
			multiple: true,
			style: { display: "none" },
			parent: document.body,
			onchange: () => this.importAll()
		});
	}

	createButtons() {
		const btns = super.createButtons();
		btns[0].textContent = "Close";
		btns[0].onclick = (e) => {
			clearTimeout(this.saveVisualCue);
			this.close();
		};
		btns.unshift(
			$el("button", {
				type: "button",
				textContent: "Export",
				onclick: () => this.exportAll()
			})
		);
		btns.unshift(
			$el("button", {
				type: "button",
				textContent: "Import",
				onclick: () => {
					this.importInput.click();
				}
			})
		);
		return btns;
	}

	async load() {
		let presets = {};
		if (app.storageLocation === "server") {
			try {
				if (app.isNewUserSession) {
					// New user so migrate existing presets
					const json = localStorage.getItem(id);
					if (json) {
						presets = JSON.parse(json);
						api.storeUserData(file, json, { stringify: false });
					}					
				} else {
					const res = await api.getUserData(file);
					if (res.status === 200) {
						presets = await res.json();						
					} else if (res.status !== 404) {
						console.error(res.status + " " + res.statusText);
					}
				}
			} catch (error) {
				console.error(error);
			}
		} else {
			const json = localStorage.getItem(id);
			if (json) {
				presets = JSON.parse(json);
			}
		}

		return presets ?? {};
	}

	async store() {
		if(app.storageLocation === "server") {			
			try {
				const presets = JSON.stringify(this.presets, undefined, 4);
				await api.storeUserData(file, presets, { stringify: false });
			} catch (error) {
				console.error(error);
			}
		} else {
			localStorage.setItem(id, JSON.stringify(this.presets));
		}
	}

	async importAll() {
		for (const file of this.importInput.files) {
			if (file.type === "application/json" || file.name.endsWith(".json")) {
				const reader = new FileReader();
				reader.onload = async () => {
					const importFile = JSON.parse(reader.result);
					if (importFile?.presets) {
						for (const nodeType in importFile.presets) {
							if (this.presets[nodeType]) {
								this.presets[nodeType] = this.presets[nodeType].concat(importFile.presets[nodeType]);								
							} else {
								this.presets[nodeType] = importFile.presets[nodeType];
							}
						}
					}
				};
				await reader.readAsText(file);
			}
		}

		this.importInput.value = null;
		this.store();
		this.close();		
	}

	exportAll() {
		if (Object.keys(this.presets).length === 0) {
			alert("No presets to export.");
			return;
		}

		const json = JSON.stringify({ presets: this.presets }, null, 2); // convert the data to a JSON string
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = $el("a", {
			href: url,
			download: "node_presets.json",
			style: { display: "none" },
			parent: document.body,
		});
		a.click();
		setTimeout(function () {
			a.remove();
			window.URL.revokeObjectURL(url);
		}, 0);
	}

	show(nodeType) {				
		const nodePresets = this.presets[nodeType];
		super.show(
			$el(
				"div",
				{},
				nodePresets.flatMap((p, i) => {
					let nameInput;
					return [
						$el(
							"div",
							{
								dataset: { id: i },
								className: "presetManagerRow",
								style: {
									display: "grid",
									gridPresetColumns: "1fr auto",
									border: "1px dashed transparent",
									gap: "5px",
									backgroundColor: "var(--comfy-menu-bg)"
								},
								ondragstart: (e) => {
									this.draggedEl = e.currentTarget;
									e.currentTarget.style.opacity = "0.6";
									e.currentTarget.style.border = "1px dashed yellow";
									e.dataTransfer.effectAllowed = 'move';
									e.dataTransfer.setDragImage(this.emptyImg, 0, 0);
								},
								ondragend: (e) => {
									e.target.style.opacity = "1";
									e.currentTarget.style.border = "1px dashed transparent";
									e.currentTarget.removeAttribute("draggable");

									// rearrange the elements
									this.element.querySelectorAll('.presetManagerRow').forEach((el,i) => {
										var prev_i = el.dataset.id;

										if ( el == this.draggedEl && prev_i != i ) {
											nodePresets.splice(i, 0, nodePresets.splice(prev_i, 1)[0]);
										}
										el.dataset.id = i;
									});
									this.store();
								},
								ondragover: (e) => {
									e.preventDefault();
									if ( e.currentTarget == this.draggedEl )
										return;

									let rect = e.currentTarget.getBoundingClientRect();
									if (e.clientY > rect.top + rect.height / 2) {
										e.currentTarget.parentNode.insertBefore(this.draggedEl, e.currentTarget.nextSibling);
									} else {
										e.currentTarget.parentNode.insertBefore(this.draggedEl, e.currentTarget);
									}
								}
							},
							[
								$el(
									"label",
									{
										textContent: "Name: ",
										style: {
											cursor: "grab",
										},
										onmousedown: (e) => {
											// enable dragging only from the label
											if (e.target.localName == 'label')
												e.currentTarget.parentNode.draggable = 'true';
										}
									},
									[
										$el("input", {
											value: p.name,
											dataset: { name: p.name },
											style: {
												transitionProperty: 'background-color',
												transitionDuration: '0s',
											},
											onchange: (e) => {
												clearTimeout(this.saveVisualCue);
												var el = e.target;
												var row = el.parentNode.parentNode;
												nodePresets[row.dataset.id].name = el.value.trim() || 'untitled';
												this.store();
												el.style.backgroundColor = 'rgb(40, 95, 40)';
												el.style.transitionDuration = '0s';
												this.saveVisualCue = setTimeout(function () {
													el.style.transitionDuration = '.7s';
													el.style.backgroundColor = 'var(--comfy-input-bg)';
												}, 15);
											},
											onkeypress: (e) => {
												var el = e.target;
												clearTimeout(this.saveVisualCue);
												el.style.transitionDuration = '0s';
												el.style.backgroundColor = 'var(--comfy-input-bg)';
											},
											$: (el) => (nameInput = el),
										})
									]
								),
								$el(
									"div",
									{},
									[
										$el("button", {
											textContent: "Export",
											style: {
												fontSize: "12px",
												fontWeight: "normal",
											},
											onclick: (e) => {
												const presets = {};
												presets[nodeType] = [p];
												const json = JSON.stringify({presets: presets}, null, 2); // convert the data to a JSON string
												const blob = new Blob([json], {type: "application/json"});
												const url = URL.createObjectURL(blob);
												const a = $el("a", {
													href: url,
													download: (nameInput.value || p.name) + ".json",
													style: {display: "none"},
													parent: document.body,
												});
												a.click();
												setTimeout(function () {
													a.remove();
													window.URL.revokeObjectURL(url);
												}, 0);
											},
										}),
										$el("button", {
											textContent: "Delete",
											style: {
												fontSize: "12px",
												color: "red",
												fontWeight: "normal",
											},
											onclick: (e) => {
												const item = e.target.parentNode.parentNode;
												item.parentNode.removeChild(item);
												nodePresets.splice(item.dataset.id*1, 1);
												this.store();
												// update the rows index, setTimeout ensures that the list is updated
												var that = this;
												setTimeout(function (){
													that.element.querySelectorAll('.presetManagerRow').forEach((el,i) => {
														el.dataset.id = i;
													});
												}, 0);
											},
										}),
									]
								),
							]
						)
					];
				})
			)
		);
	}
}

app.registerExtension({
	name: id,
	setup() {
		const presetManager = new PresetManager();		

		const orig = LGraphCanvas.prototype.getNodeMenuOptions;
        LGraphCanvas.prototype.getNodeMenuOptions = function(node) {			
			const options = orig.call(this, node);

			if (!node.widgets) {
				return options;
			}

			const loadOptions = presetManager.presets[node.type]?.map((preset) => ({
				content: preset.name,
				callback: () => {
					node.widgets.forEach((widget) => {
						if (widget.name in preset.values) {
							widget.value = preset.values[widget.name];
						}                            
					});
					node.setDirtyCanvas(true, false);
				}
			}));

			const saveCallback = () => {
				const name = prompt("Enter name");
				if (!name?.trim()) return;

				const presetValues = {};
				node.widgets.forEach(widget => presetValues[widget.name] = widget.value);

				const preset = {name: name, values: presetValues};
				if (presetManager.presets[node.type]) {
					presetManager.presets[node.type].push(preset);
				} else {
					presetManager.presets[node.type] = [preset];
				}
				presetManager.store();					
			};

			const presetOptions = [{
				content: `Save`,
				disabled: !node.widgets.length,
				callback: saveCallback
			}, {
				content: "Load",
				disabled: !presetManager.presets[node.type]?.length,
				submenu: {options: loadOptions}
			}, {
				content: "Manage",
				callback: () => presetManager.show(node.type)
			}];

			const presetMenu = {
				content: "Presets",
				submenu: {options: presetOptions}
			};

			options.push(null, presetMenu);
			return options;
		};
	},
});

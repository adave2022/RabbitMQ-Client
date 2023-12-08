import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, requestUrl } from 'obsidian';


interface RabbitMQClientSettings {
	RabbitMQURL: string;
	RabbitMQBody: string;
	RabbitMQAuthorization: string;
}

const DEFAULT_SETTINGS: RabbitMQClientSettings = {
	RabbitMQURL: '',
	RabbitMQBody: '',
	RabbitMQAuthorization: ''
}

export default class RabbitMQClient extends Plugin {
	settings: RabbitMQClientSettings;

	async onload(){
		await this.loadSettings();

		
		
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'send-vm-creation-signal',
			name: 'Send a signal to create Virtual Machine',
			callback: async () => {

				

				// Message we want to send to Server. It is constructed as JSON
				let RabbitMQMessage: any;

				//Ask user if they want VM or CT
				new AskUserForVmType(this.app, async (VMContainor) => {
				console.log("User selected: " ,VMContainor.containorType)
				// Use that to define other set of settings 
				new VmConfigurator(this.app, VMContainor.containorType, async (result) => {
				
				// get the result and save into
				RabbitMQMessage= result;	
				
				// Take the deafult body string and deconstruct the payload. 
				let parsedbody: string = JSON.parse(this.settings.RabbitMQBody);
				// save the payload with your meesage 
				parsedbody.payload = JSON.stringify(RabbitMQMessage);
				//convert whole body to string
				this.settings.RabbitMQBody = JSON.stringify(parsedbody)

				//console.log(this.settings.RabbitMQBody)
				// Then Send the Body and URl through Request url function.
				const requesttourl1 = await requestUrl({
					url: this.settings.RabbitMQURL,
					method: "POST",
					headers: {
						'Content-Type': 'application/json',
						'Authorization': this.settings.RabbitMQAuthorization
					},
					body: this.settings.RabbitMQBody
				  });
				
				// check status code
				if(requesttourl1.status == 200){
					new Notice(`Data Sent!`);
				}
				else{
					new Notice(`Failed`);
				}
				  



				

			}).open();
				}).open();

				


				
			}
		});
		
		/*/ This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});*/

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

	
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class AskUserForVmType extends Modal {
	result: any = {"containorType":""};
	onSubmit: (result: any) => void;

	constructor(app: App, onSubmit: (result: any) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;


	contentEl.createEl("h1", { text: "Define Values for Proxmox" });
    new Setting(contentEl)
      .setName("containorType")
	  .setDesc('What do you want to create? Virtual Machine(VM) or Containor (CT). VMs are full OS and CT is lightweight option')
      .addDropdown(dropDown => {
		dropDown.addOption('VirtualMachine(VM)', 'VirtualMachine(VM)');
		dropDown.addOption('Containor(CT)', 'Containor(CT)');
		dropDown.onChange((value) =>	{
		this.result.containorType = value
	  });
	});
	
    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Next")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.result);
          }));


	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class VmConfigurator extends Modal {
	result: any = {"OperatingSystem":"ubuntu20","VCPU":"1","RAM":"1","Storage":"test"};
	onSubmit: (result: any) => void;

	constructor(app: App, containorType:string ,onSubmit: (result: any) => void) {
		super(app);
		this.containorType = containorType;
		this.onSubmit = onSubmit;
		
	}

	onOpen() {
		const {contentEl} = this;


	contentEl.createEl("h1", { text: "Define Values for Proxmox" });
	
	if(this.containorType == "Containor(CT)"){
	new Setting(contentEl)
      .setName("OperatingSystem(OS)")
	  .setDesc('Which os you want to deploy')
      .addDropdown(dropDown => {
		dropDown.addOption('ubuntu-22.04.3-desktop-amd64.iso', 'Ubuntu22 Desktop');
		dropDown.addOption('ubuntu-22.04.3-live-server-amd64.iso', 'Ubuntu22 Server');
		dropDown.onChange((value) =>	{
		this.result.OperatingSystem = value
	  });
	});

	new Setting(contentEl)
		.setName("VCPU")
		.setDesc('How many VCPU or cores should be allocated?')
		.addText((text) =>
		  text.onChange((value) => {
			this.result.VCPU = value
		}));
	new Setting(contentEl)
		.setName("RAM")
		.setDesc('How much RAM should be allocated?')
		.addText((text) =>
		  text.onChange((value) => {
			this.result.RAM = value
		}));
	new Setting(contentEl)
		.setName("Storage")
		.setDesc('How much Storage should be allocated?')
		.addText((text) =>
		  text.onChange((value) => {
			this.result.Storage = value
		}));

	

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.result);
          }));
		}


	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: RabbitMQClient;

	constructor(app: App, plugin: RabbitMQClient) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('RabbitMq URL: ')
			.setDesc('Type full url of the server call')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.RabbitMQURL)
				.onChange(async (value) => {
					this.plugin.settings.RabbitMQURL = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Body Message: ')
			.setDesc('what should be the body of the api call')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.RabbitMQBody)
				.onChange(async (value) => {
					this.plugin.settings.RabbitMQBody = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Authorization Message: ')
			.setDesc('set authorization key for api call')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.RabbitMQAuthorization)
				.onChange(async (value) => {
					this.plugin.settings.RabbitMQAuthorization = value;
					await this.plugin.saveSettings();
				}));
	}
}

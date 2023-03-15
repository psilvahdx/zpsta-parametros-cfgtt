sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Text",
	"sap/ui/core/Fragment"
], function(Controller, History, UIComponent, Dialog, DialogType, Button, ButtonType, Text, Fragment) {
	"use strict";

	return Controller.extend("portoseguro.zpsta_param_cfgtt.controller.BaseController", {


		_getDialog: function (fragmentDialog) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("frmDialog",fragmentDialog, this);
				this._oDialog.addStyleClass("sapUiSizeCompact");
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		
		closeDialog: function () {
			this._getDialog().close();
			
		},
		
		_getBusyDialog: function () {
			if (!this._oBusyDialog) {
				this._oBusyDialog = sap.ui.xmlfragment("portoseguro.psta_parametros.view.dialogs.BusyDialog", this);
				this.getView().addDependent(this._oBusyDialog);
			}
			return this._oBusyDialog;
		},
		
		closeBusyDialog: function () {
			this._getBusyDialog().close();
		},

		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},
		
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		
		approveDialog: function (onConfirmar) {
			if (!this.oApproveDialog) {
				this.oApproveDialog = new Dialog({
					type: DialogType.Message,
					title: "Confirmar",
					content: new Text({ text: "Confirma a exclusão dos registros?" }),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Confirmar",
						press: function () {
							onConfirmar();
							//this.onProcess();
							this.oApproveDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancelar",
						press: function () {
							this.oApproveDialog.close();
						}.bind(this)
					})
				});
			}

			this.oApproveDialog.open();
		},

		onNavBack: function () {
			var oHistory, sPreviousHash;

			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("appHome", {}, true /*no history*/);
			}
			if (this._oDialog){
				this._oDialog.destroy();
				this._oDialog = undefined;
			}

			
		},
		
		onCancel: function(){
			var model = sap.ui.core.Fragment.byId("frmDialog", "form").getModel();
			model.deleteCreatedEntry(this._oContext);
			this.closeDialog();
		},

		geti18NText: function(key) {
			if (this.geti18NResourceBundle()) {
				return this.geti18NResourceBundle().getText(key);
			} else {
				return null;
			}
		},
		
		geti18NResourceBundle: function() {
			if (this.getView()) {
				// return this.getView().getModel("i18n").getResourceBundle();
				return this.getOwnerComponent().getModel('i18n').getResourceBundle();
			} else {
				return null;
			}
		},

		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		}

		// getLastId: function(){
		// 	var _oIdsec;
		// 	var model = this.getOwnerComponent().getModel();

		// 	model.read("/OZPSTA_CFG_EMP_TT",
		// 	{	
		// 		urlParameters: {
		// 			$top: 1,
		// 			orderby: 'Idsec',
		// 			descending: true
		// 		},
		// 		// filters: oFilters,
		// 		success: function (oRetrievedResult) {
		// 			_oIdsec = oRetrievedResult.results.Idsec;
		// 		},
		// 		error: function (oError) { /* do something */ }
		// 	});

		// 	return _oIdsec;
		// }

	});

});

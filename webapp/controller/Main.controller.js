sap.ui.define([
    "portoseguro/zpstacfgtt/controller/BaseController",
    "sap/m/MessageToast",
	"sap/ui/export/library",
	"sap/ui/export/Spreadsheet",
	"sap/ui/core/util/File",
	"sap/m/PDFViewer",
	"sap/ui/model/json/JSONModel",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/ButtonType",
    "sap/m/Label",
    'sap/ui/core/Fragment',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, MessageToast, exportLibrary, Spreadsheet, File,PDFViewer, JSONModel, Dialog, Button, ButtonType, Label, Fragment, Filter, FilterOperator) {
        "use strict";

        return BaseController.extend("portoseguro.zpstacfgtt.controller.Main", {
            onInit: function () {
                this.getView().addStyleClass("sapUiSizeCompact");
                setTimeout(function () {
                    MessageToast.show('Por favor, selecione uma origem para visualizar os dados!');
                }, 1000);
                
                // PDFViewer
                this._pdfViewer = new PDFViewer();
                this.getView().addDependent(this._pdfViewer);
                
                var oSample1Model = new JSONModel({
                    //Source: "https://s4sjtruj2lfrczsu-psta-param-cfgtt.li5131.portoseguro.brasil:30033/manuais/guia_do_usuario.pdf"
                    Source: "./manuais/guia_do_usuario.pdf?portalInterceptorAppId=zpsta_param_cfgtt_ui"
                });
                
                var oValidationModel = new JSONModel({
                    arrIdsec: [],
                    lenghtIdsec: 0
                });
                
                this.getView().setModel(oValidationModel, "oValidationModel");
                
                this.byId('btnHelp').setModel(oSample1Model);
                
                this.getView().setModel(this.ttViewModel(), "oModelTTView");

                this.byId('smartFilterBar-btnGo').setText(this.geti18NText("FILTER_BAR_GO")); 
                sap.ui.getCore().byId('__text4').setText(this.geti18NText("FILTER_BAR_NO_FILTER"));
            },
            
            onResize: function () {
                var oTable = this.getView().byId("ItemsTable");
                this.customizeTableColumnLabels(oTable);
            },
            
            onBtnOrigem: function () {
                var oTable = this.getView().byId("ItemsTable");
                var oFilterBar = this.getView().byId("smartFilterBar");
                oTable.setVisible(true);
                oFilterBar.setVisible(true);
                oTable._aColumnKeys.forEach(function (columnName) {
                    var oColumn = oTable._getColumnByKey(columnName);
                    try {
                        oColumn.setLabel(columnName);
                        oColumn.setVisible(true);
                    } catch (e) {
                        console.log(e);
                    }
                });
                this.customizeTableColumnLabels(oTable);
                oTable.rebindTable();
                this.onTTViewData();
            },
    
            onBeforeRebindTable: function (oEvent) {
                //Filtra os dados da tabela exibindo apenas os relacionados a origem selecionada no combobox
                //var oTable = this.getView().byId("ItemsTable");
                //this.customizeTableColumnLabels(oTable);
    
                var oCombo = this.getView().byId("cmbOrigens");
                var script = oCombo.getSelectedKey();
    
                var mBindingParams = oEvent.getParameter("bindingParams");
    
                var oFilterBar = this.getView().byId("smartFilterBar");
                var oFilters = oFilterBar.getFilters();
                oFilters.push(new sap.ui.model.Filter("Script", sap.ui.model.FilterOperator.EQ, script));
    
                mBindingParams.filters = oFilters;
    
            },
    
            customizeTableColumnLabels: function (oTable) {
    
                var model = oTable.getModel();
                var oCombo = this.getView().byId("cmbOrigens");
                var script = oCombo.getSelectedKey();
    
                var oFilterBar = this.getView().byId("smartFilterBar");
                var oFilters = oFilterBar.getFilters();
    
                oFilters.push(new sap.ui.model.Filter("Script", sap.ui.model.FilterOperator.EQ, script));
    
                // Buscar na tabela "PSTA_FPSL_1"."zpstaConfig.ZPSTA_CFG_SCRIPTS", para o a origem em processamento (campo script) o nome de cada campo 
                // (o campo tt_field representa a coluna da tabela TT e o campo field é o label a ser mostrado em tela para cada coluna).
    
                model.read("/OZPSTA_CFG_SCRIPTS", {
                    filters: oFilters,
                    success: function (oRetrievedResult) {
    
                        //As colunas da tabela  PSTA_FPSL_1"."zpstaConfig.ZPSTA_CFG_TT" que não possuem um label na tabela 
                        //"PSTA_FPSL_1"."zpstaConfig.ZPSTA_CFG_SCRIPTS", não devem ser mostradas.
                        //var ignoreFields = "";
                        oTable._aColumnKeys.forEach(function (columnName) {
                            var oColumn = oTable._getColumnByKey(columnName);
    
                            if (columnName.includes("field")) {
                                //oTable.setIgnoredFields(ignoreFields);
                                oColumn.setVisible(false);
                            }
    
                            jQuery.each(oRetrievedResult.results, function (index, value) {
                                if (columnName === value.ttField) {
                                    oColumn.setLabel(value.field);
                                    oColumn.setVisible(true);
                                }
                            });
    
                        });
    
                    },
                    error: function (oError) { /* do something */ }
                });
    
            },
    
            onSave: function () {
                var oModel = this.getOwnerComponent().getModel();
    
                var mParameters = {
                    sucess: function (oData, response) {
                        MessageToast.show("Salvo com sucesso!");
                    },
                    error: function (oError) {
                        if (oError) {
                            if (oError.responseText) {
                                var oErrorMessage = JSON.parse(oError.responseText);
                                sap.m.MessageBox.alert(oErrorMessage.error.message.value);
                            }
                        }
                    }
                };
    
                oModel.submitChanges(mParameters);
            },
    
            onDelete: function () {
                var that = this;
                var oModel = that.getOwnerComponent().getModel();
                this.approveDialog(function () {
                    var tblDados = that.byId("ItemsTable").getTable(),
                        selectedIndices = tblDados.getSelectedIndices();
    
                    if (selectedIndices.length > 0) {
    
                        selectedIndices.forEach(function (selectedIndex) {
    
                            var context = tblDados.getContextByIndex(selectedIndex);
                            var IDSEC = context.getObject().IDSEC;
                            var path = "/OZPSTA_CFG_TT(\'" + IDSEC + "\')";
                            // var path = context.getPath();
                            
                            oModel.remove(path);
                        });
                        
                        
                        tblDados.clearSelection();
                        oModel.refresh();
    
                    } else {
                        var oBundle = this.getResourceBundle();
                        var sMsg = oBundle.getText("msgNenhumSelecionado");
                        MessageToast.show(sMsg);
                    }
    
                });
    
            },
    
            openDialog: function (sPath, oModel) {
    
                sap.ui.core.BusyIndicator.show();
                var dialog = this._getDialog("portoseguro.zpstacfgtt.view.Dialogs.AddDialog");
                sap.ui.core.Fragment.byId("frmDialog", "form").bindElement(sPath);
    
                var oCombo = this.getView().byId("cmbOrigens");
                var script = oCombo.getSelectedKey();
    
                var oFilters = [];
                oFilters.push(new sap.ui.model.Filter("Script", sap.ui.model.FilterOperator.EQ, script));
    
                var that = this;
                dialog.open();
                sap.ui.core.BusyIndicator.hide();

    
                oModel.read("/OZPSTA_CFG_SCRIPTS", {
                    filters: oFilters,
                    success: function (oRetrievedResult) {
    
                        //As colunas da tabela  PSTA_FPSL_1"."zpstaConfig.ZPSTA_CFG_TT" que não possuem um label na tabela 
                        //"PSTA_FPSL_1"."zpstaConfig.ZPSTA_CFG_SCRIPTS", não devem ser mostradas.
                        for (var i = 1; i <= 16; i++) {
                            var field;
                            if (i < 10) {
                                field = 'field0' + i;
                            } else {
                                field = 'field' + i;
                            }
                            var fieldTela = sap.ui.core.Fragment.byId("frmDialog", field);
                            fieldTela.setVisible(false);
                            var valorEncontrado = that.buscarFields(oRetrievedResult.results, field);
                            if (valorEncontrado !== undefined) {
                                fieldTela.setVisible(true);
                                fieldTela.setTextLabel(valorEncontrado.Field);
                            }
                        }
                        // sap.ui.core.BusyIndicator.hide();
                        // dialog.open();
                    },
                    error: function (oError) { /* do something */ }
                });
    
            },
    
            onNew: function () {
    
                var newItem = {
                    "CodigoEmpresa" : 0,
                    "CodigoEventoNegocio" : "",
                    "Field01" : "",
                    "Field02" : "",
                    "Field03" : "",
                    "Field04" : "",
                    "Field05" : "",
                    "Field06" : "",
                    "Field07" : "",
                    "Field08" : "",
                    "Field09" : "",
                    "Field10" : "",
                    "Field11" : "",
                    "Field12" : "",
                    "Field13" : "",
                    "Field14" : "",
                    "Field15" : "",
                    "Field16" : "",
                    "TransactionType" : "",
                    "DescTransactionalType" : "",
                    "ContDataVigencia" : ""
                    // "Idsec" : 99
                };
    
                var oModel = this.getOwnerComponent().getModel();
                var oContext = oModel.createEntry("/OZPSTA_CFG_EMP_TT", {
                    properties: newItem
                });
                this._oContext = oContext;
                var path = oContext.getPath();
                this.openDialog(path, oModel);
    
            },
    
            onEdit: function () {
    
                var tblDados = this.byId("ItemsTable").getTable(),
                    selectedIndices = tblDados.getSelectedIndices();
                var that = this;
                if (selectedIndices.length === 1) {
    
                    selectedIndices.forEach(function (selectedIndex) {
    
                        var context = tblDados.getContextByIndex(selectedIndex);
                        var IDSEC = context.getObject().IDSEC;
                        var path = "/OZPSTA_CFG_TT(\'" + IDSEC + "\')";
                        // var path = "/OZPSTA_CFG_TT(\'" + IDSEC + "\')";
                        var oModel = that.getOwnerComponent().getModel();
    
                        that.openDialog(path, oModel);
    
                    });
    
                } else {
                    var oBundle = this.getResourceBundle();
                    var sMsg = oBundle.getText("msgApenasUmSelecionado");
                    MessageToast.show(sMsg);
                }
    
            },
    
            buscarFields: function (results, fieldName) {
                var valueEncontrado;
    
                jQuery.each(results, function (index, value) {
                    if (fieldName === value.TtField) {
                        valueEncontrado = value;
                    }
    
                });
    
                return valueEncontrado;
            },
    
            onAdd: function () {
    
                var path = sap.ui.core.Fragment.byId("frmDialog", "form").getElementBinding().getPath();
                var model = sap.ui.core.Fragment.byId("frmDialog", "form").getModel();
                // var boundItem = model.getProperty(path);
                var that = this;
                
                // Valida Transaction_Type
                /*var iptTtType = sap.ui.core.Fragment.byId("frmDialog", "transaction_type").getValue();
                var status = that.onValTType(iptTtType);
                
                if(status === "erro"){
                    return;
                }*/

                var formDialog = sap.ui.core.Fragment.byId("frmDialog", "form").getElementBinding();
                var formPath = sap.ui.core.Fragment.byId("frmDialog", "form").getElementBinding().sPath;
                formPath = formPath.substr(1);
                var formEntity = formDialog.oModel.mChangedEntities[formPath];

                formEntity.CodigoEmpresa = parseInt(sap.ui.core.Fragment.byId("frmDialog", "codigo_empresa")._oControl.edit.mProperties.value);
                formEntity.CodigoEventoNegocio = sap.ui.core.Fragment.byId("frmDialog", "codigo_evento_negocio")._oControl.edit.mProperties.value;
                formEntity.TransactionType = sap.ui.core.Fragment.byId("frmDialog", "transaction_type_0").mProperties.value;
                formEntity.DescTransactionalType = sap.ui.core.Fragment.byId("frmDialog", "desc_transactional_type")._oControl.edit.mProperties.value;
                formEntity.ContDataVigencia = sap.ui.core.Fragment.byId("frmDialog", "cont_data_vigencia")._oControl.edit.mProperties.value;
                var boundItem = model.getProperty(path);

                that.onValidaDados(model, that, function () {
                    var mParameters = {
                        success: function (oData, response) {
                            var oTable = that.getView().byId("ItemsTable");
                            oTable.rebindTable();
                            sap.ui.core.BusyIndicator.hide();
                            MessageToast.show("Salvo com sucesso!");
                            that.closeDialog();
                        },
                        error: function (oError) {
                            if (oError) {
                                if (oError.responseText) {
                                    sap.ui.core.BusyIndicator.hide();
                                    var oErrorMessage = JSON.parse(oError.responseText);
                                    sap.m.MessageBox.alert(oErrorMessage.error.message.value);
                                    that.closeDialog();
                                }
                            }
                        }
                    };
    
                    model.submitChanges(mParameters);
                    model.refresh();
                });
    
            },
    
            onValidaDados: function (model, that, sucessCallBack) {
                var oCombo = this.getView().byId("cmbOrigens");
                var codigo_empresa = sap.ui.core.Fragment.byId("frmDialog", "codigo_empresa");
                var codigo_evento_negocio = sap.ui.core.Fragment.byId("frmDialog", "codigo_evento_negocio");
                var script = oCombo.getSelectedKey();
    
                //Verificar se a codigo_empresa e codigo_evento_negocio pertence a origem em processamento
                //zpstaConfig.ZPSTA_CFG_EMP_EVE
                var oFilters = [];
                oFilters.push(new sap.ui.model.Filter("Script", sap.ui.model.FilterOperator.EQ, script));
                oFilters.push(new sap.ui.model.Filter("CodigoEmpresa", sap.ui.model.FilterOperator.EQ, codigo_empresa.getValue().replace('.', '')));
                oFilters.push(new sap.ui.model.Filter("CodEveNegocio", sap.ui.model.FilterOperator.EQ, codigo_evento_negocio.getValue()));
                sap.ui.core.BusyIndicator.show();
                model.read("/OZPSTA_CFG_EMP_EVE", {
                    filters: oFilters,
                    success: function (oRetrievedResult) {
                        if (oRetrievedResult.results.length > 0) {
                            sucessCallBack();
                        } else {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageBox.error('Cod. Empresa e Cod. Evento Negócio informado não existe na tabela ZPSTA_CFG_EMP_EVE');
                        }
    
                    },
                    error: function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            },
    
            // onDataReceived: function () {
    
            //     var oTable = this.byId("ItemsTable");
            //     var i = 0;
            //     oTable.getTable().getColumns().forEach(function (oLine) {
            //         var oFieldName = oLine.getId();
            //         oFieldName = oFieldName.substring(oFieldName.lastIndexOf("-") + 1, oFieldName.length);
            //         //var oFielTemplate = aTemplate.find(element => {return element.fieldName === oFieldName;});
            //         if(oFieldName){
            //             oLine.setProperty("width","200px");
            //         }
            //         i++;
            //     });
    
            //     this.customizeTableColumnLabels(oTable);
    
            // },
    
            onDownloadTemplatePressed: function () {
    
                var oSettings, oSheet;
    
                var oTable = this.byId("ItemsTable");
                var model = oTable.getModel();
                var oCombo = this.getView().byId("cmbOrigens");
                var script = oCombo.getSelectedKey();
    
                var oFilterBar = this.getView().byId("smartFilterBar");
                var aFilters = [];
    
                aFilters.push(new sap.ui.model.Filter("Script", sap.ui.model.FilterOperator.EQ, script));
                var oBusyDialog = new sap.m.BusyDialog();
    
                oBusyDialog.open();
    
                model.read("/OZPSTA_CFG_SCRIPTS", {
                    filters: aFilters,
                    sorters: [
                        new sap.ui.model.Sorter("TtField")
                    ],
                    success: function (oRetrievedResult) {
    
                        var aLayoutFields = [{
                            label: 'codigo_empresa',
                            property: 'CodigoEmpresa'
                        }, {
                            label: 'codigo_evento_negocio',
                            property: 'CodigoEventoNegocio'
                        }];
    
                        jQuery.each(oRetrievedResult.results, function (index, value) {
                            aLayoutFields.push({
                                label: value.Field,
                                property: value.Field
                            });
                        });
    
                        aLayoutFields.push({
                            label: 'cont_data_vigencia',
                            property: 'ContDataVigencia'
                        });
                        aLayoutFields.push({
                            label: 'transaction_type',
                            property: 'TransactionType'
                        });
                        aLayoutFields.push({
                            label: 'desc_transactional_type',
                            property: 'DescTransactionalType'
                        });
                        aLayoutFields.push({
                            label: 'IDSEC',
                            property: 'Idsec'
                        });
    
                        oSettings = {
                            workbook: {
                                columns: aLayoutFields,
                                context: {
                                    sheetName: 'ZPSTA_CFG_EMP_TT'
                                }
                            },
                            dataSource: aLayoutFields,
                            fileName: `ZPSTA_CFG_EMP_TT_${script}.xlsx`,
                            count: 1 //,
                                //worker: false // We need to disable worker because we are using a MockServer as OData Service
                        };
    
                        oBusyDialog.close();
    
                        oSheet = new Spreadsheet(oSettings);
                        oSheet.build().finally(function () {
                            oSheet.destroy();
                        });
    
                    },
                    error: function (oError) {
                        oBusyDialog.close();
                        sap.m.MessageBox.error("Erro ao fazer download do template:" + oError);
                    }
                });
    
            },
    
            onfileSizeExceed: function () {
                sap.m.MessageBox.error(this.getResourceBundle().getText("MSG_FILE_SIZE"));
            },
    
            handleUploadComplete: function (oEvent) {
                var sResponseStatus = oEvent.getParameter("status");
                var oFileUploader = this.byId("fileUploader");
                if (sResponseStatus === 200) {
                    var sResponse = oEvent.getParameter("responseRaw");
                    MessageToast.show(sResponse);
                    oFileUploader.setValue("");
                    var obtnImportFile = this.byId("btnImportFile");
                    obtnImportFile.setVisible(false);
                    var oModel = this.getView().getModel();
                    oModel.refresh();
                } else {
                    //MessageToast.show("Erro ao fazer upload do arquivo");
                    sap.m.MessageBox.error("Erro ao fazer upload do arquivo");
                }
                oFileUploader.destroyHeaderParameters();
            },
    
            handleTypeMissmatch: function (oEvent) {
                var aFileTypes = oEvent.getSource().getFileType();
                jQuery.each(aFileTypes, function (key, value) {
                    aFileTypes[key] = "*." + value;
                });
                var sSupportedFileTypes = aFileTypes.join(", ");
                MessageToast.show("O Tipo do arquivo *." + oEvent.getParameter("fileType") +
                    " não permitido. Selecione arquivos dos seguintes tipos: " +
                    sSupportedFileTypes);
            },
    
            handleValueChange: function (oEvent) {
                var obtnImportFile = this.byId("btnImportFile");
                obtnImportFile.setVisible(true);
    
            },
    
            onExportToExcel: function () {
    
                var oSettings, oSheet;
                var oTable = this.byId("ItemsTable");
                var model = oTable.getModel();
                var oCombo = this.getView().byId("cmbOrigens");
                var script = oCombo.getSelectedKey();
                var oFilterBar = this.getView().byId("smartFilterBar");
                var aFilters = [];
                var that = this;
    
                aFilters.push(new sap.ui.model.Filter("Script", sap.ui.model.FilterOperator.EQ, script));
    
                model.read("/OZPSTA_CFG_SCRIPTS", {
                    filters: aFilters,
                    sorters: [
                        new sap.ui.model.Sorter("TtField")
                    ],
                    success: function (oRetrievedResult) {
    
                        var aLayoutFields = [{
                            label: 'codigo_empresa',
                            property: 'codigo_empresa'
                        }, {
                            label: 'codigo_evento_negocio',
                            property: 'codigo_evento_negocio'
                        }];
    
                        jQuery.each(oRetrievedResult.results, function (index, value) {
                            aLayoutFields.push({
                                label: value.Field,
                                property: value.TtField
                            });
    
                        });
    
                        aLayoutFields.push({
                            label: 'cont_data_vigencia',
                            property: 'cont_data_vigencia'
                        });
                        aLayoutFields.push({
                            label: 'transaction_type',
                            property: 'transaction_type'
                        });
                        aLayoutFields.push({
                            label: 'desc_transactional_type',
                            property: 'desc_transactional_type'
                        });
                        aLayoutFields.push({
                            label: 'IDSEC',
                            property: 'IDSEC'
                        });
    
                        oSettings = {
                            workbook: {
                                columns: aLayoutFields,
                                context: {
                                    sheetName: 'ZPSTA_CFG_EMP_TT'
                                }
                            },
                            dataSource: null,
                            fileName: `ZPSTA_CFG_EMP_TT_${script}.xlsx`
    
                        };
    
                        that.exportToExcel(aLayoutFields, oSettings);
    
                    },
                    error: function (oError) {
    
                        sap.m.MessageBox.error("Erro ao fazer download:" + oError);
                    }
                });
    
            },
    
            exportToExcel: function (aSelectedColumns, oSettings) {
                var oRowBinding, oSettings, oSheet, oTable;
    
                var oBusyDialog = new sap.m.BusyDialog();
                oBusyDialog.text = 'Baixando dados do Servidor...';
                oBusyDialog.showCancelButton = true;
    
                oBusyDialog.open();
    
                let aSkipTop = [];
                let nSkip = 0;
                let nTrys = 0;
                var aPromisses = [];
                var nTop = 10000;
                var that = this;
    
                if (!this._oTable) {
                    this._oTable = this.byId('ItemsTable').getTable();
                }
    
                oTable = this._oTable;
                oRowBinding = oTable.getBinding('rows');
    
                nTrys = oRowBinding.getLength ? oRowBinding.getLength() : 0;
                nTrys = (nTrys / nTop);
    
                while (nTrys > 0) {
                    aSkipTop.push({
                        skip: nSkip,
                        top: nTop
                    });
    
                    nSkip += nTop;
                    nTrys--;
                }
    
                var sUrl = oRowBinding.getDownloadUrl();
    
                aSkipTop.forEach(element => {
                    aPromisses.push(fetch(`${sUrl}&$skip=${element.skip}&$top=${element.top}&sap-language=PT`, {
                        method: "GET"
                    }));
                    // `${sUrl}&$skip=${element.skip}&$top=${element.top}&sap-language=PT&portalInterceptorAppId=zpsta_param_cfgtt_ui`
                });
    
                var aAllResults = [];
    
                Promise.all(aPromisses)
                    .then(function (responses) {
                        // Get a JSON object from each of the responses
                        return Promise.all(responses.map(function (response) {
                            return response;
                        }));
                    }).then(function (data) {
    
                        var aData = data.map(function (res) {
                            return res.d
                        });
                        var aResults = aData.map(res => {
                            return res.results
                        });
    
                        aResults.forEach(element => {
    
                            element.forEach(item => {
                                delete item.__metadata;
                                aAllResults.push(item)
                            });
    
                        });
    
                        oBusyDialog.close();
    
                        if (aAllResults.length > 100000) {
                            var sFilename = oSettings.fileName;
                            sFilename = sFilename.substring(0, sFilename.length - 5);
                            that.exportToCSV(aAllResults, aSelectedColumns, sFilename);
    
                        } else {
    
                            oSettings.dataSource = aAllResults;
                            oSheet = new Spreadsheet(oSettings);
                            oSheet.build().finally(function () {
                                oSheet.destroy();
                            });
                        }
    
                    }).catch(function (error) {
                        console.log(error);
                        oBusyDialog.close();
    
                    });
    
            },
    
            exportToCSV: function (aResults, aColumns, sFileName) {
                var aColumnNames = aColumns.map(col => col.label);
                //const items = aResults
                const replacer = (key, value) => value === null ? '' : value
                const header = aColumnNames; //Object.keys(items[0])
                var items = [];
    
                for (var i = 0; i < aResults.length; i++) {
                    var item = aResults[i];
                    var oItemAux;
                    oItemAux = {
                        codigo_empresa: item.codigo_empresa,
                        codigo_evento_negocio: item.codigo_evento_negocio,
    
                    };
                    //parte dinamica
                    var fld = 1;
                    for (var col = 2; col < aColumnNames.length - 4; col++) {
    
                        var fldName = "field";
                        if (fld < 10) {
                            fldName = "field0" + fld;
                        } else {
                            fldName = "field" + fld;
                        }
                        oItemAux[aColumnNames[col]] = item[fldName];
                        fld++;
                    }
    
                    oItemAux.cont_data_vigencia = item.cont_data_vigencia;
                    oItemAux.transaction_type = item.transaction_type;
                    oItemAux.desc_transactional_type = item.desc_transactional_type;
                    oItemAux.IDSEC = item.IDSEC;
                    items.push(oItemAux);
    
                }
    
                const csv = [
                    header.join(';'), // header row first
                    ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(';'))
                ].join('\r\n')
    
                sap.ui.core.util.File.save(csv, sFileName, "csv", "text/csv", "utf-8", true);
    
            },
            
            onPDFViewer: function (oEvent) {
                var sSource = oEvent.getSource().getModel().getData().Source;
                this._pdfViewer.setSource(sSource);
                this._pdfViewer.setTitle("Guia do usuario");
                this._pdfViewer.open();
            },
            
            handleFiles: function(oEvent){
                var that = this;
                //	File reader
                var oFileToRead = oEvent.getParameters().files["0"];
                var oFileSource = oEvent.oSource;
                var reader = new FileReader();
                //	Models
                var _currModel = this.getView().getModel();
                var _oNewModel = this.getView().getModel("oValidationModel");
                //	handleUploadPress function
                var oFileUploader = this.byId("fileUploader");
                var currView = this.getView();
                var oCombo = currView.byId("cmbOrigens");
                var obtnImportFile = this.byId("btnImportFile");
                //	IDSEC
                var linesIdsecVal = 0;
                var linesIdsecArr = [];
                
                // Read file into memory as UTF-8
                reader.readAsText(oFileToRead);
                
                // Handle errors load
                reader.onload = loadHandler;
                reader.onerror = errorHandler;
                
                function loadHandler(event) {
                    var csv = event.target.result;
                    processData(csv);
                }
                
                function errorHandler(evt) {
                    if(evt.target.error.name == "NotReadableError") {
                        alert("Cannot read file !");
                    }
                }
                
                //	Recupera valores IDSEC do arquivo CSV
                function processData(csv) {
                    var allTextLines = csv.split(/\r\n|\n/);
                    var lines = [];
                    var lineObj = [];
                    
                    // Recuperando os dados do csv e transformando em ***
                    for (var i=0; i<allTextLines.length; i++) {
                        var data = allTextLines[i].split(';');
                        var tarr = [];
                        for (var j=1; j<data.length; j++) {
                            tarr.push(data[j]);
                        }
                        lines.push(tarr);
                    }
                    
                    // Convertendo em objetos e inserindo no Array para validações
                    for(var i = 1; i < lines.length; i++){
                        var obj = `{"${lines[0][0]}" : "${lines[i][0]}", "${lines[0][1]}" : "${lines[i][1]}", "${lines[0][2]}" : "${lines[i][2]}", 
                        "${lines[0][3]}" : "${lines[i][3]}", "${lines[0][4]}" : "${lines[i][4]}", "${lines[0][5]}" : "${lines[i][5]}", 
                        "${lines[0][6]}" : "${lines[i][6]}", "${lines[0][7]}" : "${lines[i][7]}", "${lines[0][8]}" : "${lines[i][8]}", 
                        "${lines[0][9]}" : "${lines[i][9]}", "${lines[0][10]}" : "${lines[i][10]}", "${lines[0][11]}" : "${lines[i][11]}"}`;
                        lineObj.push(JSON.parse(obj));
                    }
                    
                    // Validando Transaction Types
                    var status = that.onValTType(lineObj);
                    if(status === "erro"){
                        oFileSource.resetProperty('value');
                        return;
                    }
                    
                    // Verificando se campo Idsec está preenchido 
                    for(i=0; i < lineObj.length; i++){ 
                        if(lineObj[i].IDSEC != ''){
                            linesIdsecVal += 1;
                            linesIdsecArr.push(lineObj[i].IDSEC);
                        }else{
                            linesIdsecVal += 0;
                        }
                    }
                    
                    _oNewModel.setProperty("/arrIdsec", linesIdsecArr); // Idsec com campo preenchido
                    _oNewModel.setProperty("/lenghtIdsec", linesIdsecVal); // Contador de Idsec com campo vazio
                    
                    // Se o contador não estiver vazio, seguirá para validação de Idsec
                    var total, valMessage;
                    if(linesIdsecVal > 0){
                        total = linesIdsecVal;
                        valMessage = 1;
                        validDialog(total, valMessage);
                    }else{
                        total = lines.length-1;
                        valMessage = 0;
                        validDialog(total, valMessage);
                    }
                }
                
                //Recupera IDSEC da tabela e compara com os IDSEC do csv
                /*function validateIdsec(){
                    var script = oCombo.getSelectedKey();
                    var sPath = "/OZPSTA_CFG_EMP_TT";
                    var oDataIdsec = [];
                    var oFilters = [];
                    var oBusyDialog = new sap.m.BusyDialog();
                    oBusyDialog.open();
                    oFilters.push(new sap.ui.model.Filter("script", sap.ui.model.FilterOperator.EQ, script));
                    
                    _currModel.read(sPath, {
                        filters: oFilters,
                        
                        success: function(oData){
                            var i = 0;
                            var total = 0;
                            var valMessage = 0;
                            
                            for(i = 0; i < oData.results.length; i++){
                                oDataIdsec.push(oData.results[i].IDSEC);
                            }
                            
                            for(i = 0; i < linesIdsecArr.length; i++){
                                if(oDataIdsec.includes(linesIdsecArr[i].toString())){
                                    total += 1; valMessage += 1;
                                }else{
                                    total += 1;
                                }
                            }
                            validDialog(total, valMessage);
                        },
                        
                        error: function(){
                            console.error(`ERR: Erro ao ler a entidade ${sPath}`);
                        }
                    })
                    
                    oBusyDialog.close();
                }*/
                
                //	Instanciar um Dialog flexivel, com base na validação
                function validDialog(total, valMessage){
                    var updMessage = `Encontramos ${total} registro(s) que possuem IDSEC. Estes registros podem sobrescrever outros na tabela. \n Deseja continuar?`;
                    var insMessage = `Deseja importar ${total} novo(s) registro(s)?`;
                    var sMessage;
                    var sTitle;
                    var sIcon;
                    
                    if(valMessage != 0){
                        sMessage = updMessage;
                        sTitle = 'Aviso';
                        sIcon = "sap-icon://message-warning";
                    }else{
                        sMessage = insMessage;
                        sTitle = 'Informação';
                        sIcon = "sap-icon://message-information";
                    }
                    
                    if(!oDialog){
                        var oDialog = new sap.m.Dialog({
                            title: sTitle,
                            icon :sIcon,
                            contentWidth: '320px',
                            contentHeight: '85px',
                            content: [
                                sap.m.FlexAlignContent.center,
                                new Label({
                                    text: sMessage,
                                    textAlign: "Center",
                                    wrapping: true
                                }),
                            ],
                            beginButton: new Button({
                                type: ButtonType.Emphasized,
                                text: "Importar",
                                press: function (oEvent) {
                                    handleUploadPress();
                                    oDialog.close();
                                }.bind(this)
                            }),
                            endButton: new Button({
                                type: ButtonType.Default,
                                text: "Cancelar",
                                press: function () {
                                    oFileSource.resetProperty('value');
                                    oDialog.close();
                                }.bind(this)
                            })
                        });
                        oDialog.open();
                    }
                    
                }
                
                //	Upload/importação de csv
                function handleUploadPress(){
                    if (!oFileUploader.getValue()) {
                    MessageToast.show("Nenhum arquivo selecionado");
                    return;
                }
    
                oFileUploader.addHeaderParameter(
                    new sap.ui.unified.FileUploaderParameter({
                        name: "X-CSRF-Token",
                        value: currView.getModel().getSecurityToken()
                    })
                );
    
                oFileUploader.addHeaderParameter(
                    new sap.ui.unified.FileUploaderParameter({
                        name: "x-custom-origem",
                        value: oCombo.getSelectedKey()
                    })
                );
    
                oFileUploader.setSendXHR(true);
    
                oFileUploader.upload();
                }
            },
            
            onValTType : function(newData){
                var ttViewModel = this.getView().getModel("oModelTTView");
                var validIdx = 0;
                var validTT = [];
                var lnIdx = [];
                var status;
                var errorMessage;
                var oBusyDialog = new sap.m.BusyDialog();
                oBusyDialog.open();
                
                for(var j = 0; j < ttViewModel.oData.length; j++){
                    validTT.push(ttViewModel.oData[j].TransType);
                }
                
                for(var i = 0; i < newData.length; i++){
                    if(validTT.includes(newData[i].transaction_type)){
                        validIdx += 0;
                    }else{
                        lnIdx.push(i + 2);
                    }
                }
                
                oBusyDialog.close();
                
                if(lnIdx.length > 0){
                    errorMessage = `Transaction type invalido! \n Linha(s): ${lnIdx}`;
                    sap.m.MessageBox.information(errorMessage, {styleClass: "mBox_layout"});
                    status = 'erro';
                }
                return status;
            },
            
            onTTViewData : function(){
                var viewModel = this.getView().getModel();
                var ttViewModel = this.getView().getModel("oModelTTView");
                var currOrigin = this.getView().byId("cmbOrigens").getSelectedKey().substr(7, 8)+".";
                var aFilters = [];
                
                var aFilter = new sap.ui.model.Filter("TransType", sap.ui.model.FilterOperator.Contains, currOrigin);
                aFilters.push(aFilter);
                
                /**/viewModel.read("/OZPSTA_TRANS_TYPE", {
                    //filters: aFilters,
    
                    success: function (oData) {
                        //ttFields = oData.results;
                        ttViewModel.setData(oData.results);
                    },
                    error: function () {
                        console.log('erro');
                    }
                });
            },
            
            ttViewModel: function(){
                var oModelTTView = new sap.ui.model.json.JSONModel({
                    TransType: 0,
                    TTransTypeS: ""
                });
                return oModelTTView;
            },
            
            handleSelectDialogPress: function (oEvent) {
                var oButton = oEvent.getSource();
                
                if (!this._oTTDialog) {
                    Fragment.load({
                        name: "portoseguro.zpstacfgtt.view.Dialogs.ttDialog",
                        controller: this
                    }).then(function(oDialog){
                        this._oTTDialog = oDialog;
                        //this._oTTDialog.setModel(this.ttViewModel(), "oModelTTView");
                        this.getView().addDependent(oDialog);  
                        this._oTTDialog.open();
                    }.bind(this));
                } else {
                    this._oTTDialog.open();
                }
                
                // var tTypeIpt = sap.ui.core.Fragment.byId("frmDialog", "transaction_type");
                // tTypeIpt.setPlaceholder("Selecione um transaction type");
            },
            
            handleSearch: function(oEvent) {
                var sValue = oEvent.getParameter("value");
                var nCheck = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
                var vCheck = parseInt(sValue[0]);
                var queryParameter;
                var oFilter = [];
                
                nCheck.includes(vCheck) ? queryParameter = "TransType" : queryParameter = "TTransTypeS";
                
                oFilter = new Filter(queryParameter, FilterOperator.Contains, sValue);
                var oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([oFilter]);
            },
            
            handleClose: function(oEvent) {
                var aContexts = oEvent.getParameter("selectedContexts");
                var ttIpt = sap.ui.core.Fragment.byId("frmDialog", "transaction_type");
                var ttIptBinding = sap.ui.core.Fragment.byId("frmDialog", "transaction_type_0");
                var ttDescrIpt = sap.ui.core.Fragment.byId("frmDialog", "desc_transactional_type");
                var ttIptValue = oEvent.mParameters.selectedItem.getTitle();
                var ttDescrValue = oEvent.mParameters.selectedItem.getDescription();
                
                if (aContexts && aContexts.length) {
                    ttIpt.setValue(ttIptValue);
                    ttIptBinding.setValue(ttIptValue);
                    ttDescrIpt.setValue(ttDescrValue);
                    //MessageToast.show("You have chosen " + aContexts.map(function(oContext) { return oContext.getObject().Name; }).join(", "));
                } else {
                    //MessageToast.show("No new item was selected.");
                }
                oEvent.getSource().getBinding("items").filter([]);
            }
        });
    });

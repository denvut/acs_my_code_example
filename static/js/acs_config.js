UBD.ACSConfig = function () {
    var editSystemConfig = function(id) {
        var apiurl = $('#object_' + id).data('url');
        $.get(apiurl, function(data) {
            UBD.ACSConfigDialog.resetForm();
            $('#system_config_warn').hide().text('');
            for (var key in data) {
                if (data[key] && data[key].length == 0 && $('#d_' + key).length) {
                    $('#' + key).attr('placeholder', 'Not set. Default is used');
                }
                else {
                    $('#' + key).val(data[key]);
                }
            }
            var loaded_config = $('#system_config_dialog_form').toDeepJson({
                convert_types: false
            });
            $("#system_config_dialog").dialog('option', {
                title: 'Edit Configuration for System ' + data.hardware_id,
                buttons: {
                    Ok: {
                        text: 'Save',
                        click: function() {
                            if (!UBD.ACSConfigDialog.prepare_submit()) {
                                return;
                            }
                            var params = $('#system_config_dialog_form').toDeepJson({
                                convert_types: false
                            });
                            if (LIB.isEqual(loaded_config, params)) {
                                $(this).dialog('close');
                                return;
                            }
                            UBD.API.update({
                                url: apiurl,
                                data: params,
                                error: UBD.ACSConfigDialog.displayError,
                                enable_default_error_handler: false,
                                auto_lock_ui: true
                            });
                        }
                    },
                    Cancel: {
                        text: 'Cancel',
                        click: function() {$(this).dialog('close'); }
                    }
                }
            }).dialog('open');

            UBD.MapSet.find_item(id);

        });
    };

    var init = function() {
        $('#acs_list .edit_one').
            button({icons: {primary: 'ui-icon-pencil'}, text: false}).
            click(function() {
                  UBD.MapSet.closePopups();
                  editSystemConfig($(this).parents('#acs_list tr').attr('id').split('_')[1]);
                  });

        var delete_handler = UBD.listActions.deleter({
            table: '#acs_list',
            objname: 'System Configuration',
            api_delete_op: $("#system_config_dialog_form").data('url'),
        });

        $('#acs_list').checkboxedList({
            buttons: [
            {
                id: 'add_config_button',
                text: 'Add System Configuration',
                button_type: $.fn.checkboxedList.BUTTON_TYPES.ALL,
                action: UBD.ACSConfigDialog.addSystemConfig
            },
            {
                id: 'delete_config_button',
                text: 'Delete',
                button_type: $.fn.checkboxedList.BUTTON_TYPES.MULTIPLE,
                action: delete_handler
            }
            ],
            click_to_edit: {},
            data_table_options: {
                "bPaginate": false,
                "bLengthChange": true,
                "bFilter": true,
                "bSort": true,
                "bInfo": false,
                "bAutoWidth": false,
                "aaSorting": [[1, "asc"]],
                "asStripeClasses": ['ubd-evenrow', 'ubd-oddrow'],
                "aoColumnDefs": [
                {
                    "bSortable": false,
                    "bVisible": true,
                    "aTargets": [0]
                },
                {
                    "orderData": 5,
                    "bVisible": true,
                    "aTargets": [7]
                },
                {
                    "bSortable": false,
                    "bVisible": false,
                    "aTargets": [10]
                },
                ]
            }
        });
    };

    return {
        init: init,
        editSystemConfig: editSystemConfig
    };
}();

UBD.ACSConfigDialog = function() {

    var displayError = function(jqXHR, textStatus, errorThrown) {
        $('#system_config_warn').addClass("ui-state-error").show().html(jqXHR.responseText);
        var r = /^(.*) is already used$/;
        var ret = r.exec(jqXHR.responseText);
        if (ret) {
            var input = null;
            if (ret[1] == 'Hardware ID') {
                input = $('#hardware_id');
            } else if (ret[1] == 'IPv4 address') {
                input = $('#ip4_cidr');
            }
            if (input)
                $('label[for="' + input.attr('id') + '"]').addClass('ui-state-error');
        }
    };

    var doAddSystemConfig = function() {
        var form = $("#system_config_dialog_form");
        var url = form.data('url');
        var req = form.toDeepJson({
            convert_types: false
        });
        UBD.API.create({
            url: url,
            data: req,
            auto_lock_ui: true,
            error: displayError,
            enable_default_error_handler: false
        });
    };

    var addSystemConfig = function() {
        $("#system_config_dialog").
        dialog('option', 'title', 'Add System Configuration').
        dialog('option', 'buttons', {
            "Add": function() {
                if (prepare_submit())
                    doAddSystemConfig();
            },
            "Cancel": function() {
                $(this).dialog('close');
            }
        }).dialog('open');
        $("#system_config_warn").hide().text("");
        $("#system_config_dialog * label").removeClass('ui-state-error');
        resetForm();
        UBD.MapSet.closePopups();
    };


    var resetForm = function() {
        LIB.validation.resetFieldsErrors($('#system_config_dialog_form input'));
        $("#system_config_dialog_form")[0].reset();
        $('#system_config_warn').hide().text('');
        $('#ip4_gateway').attr('placeholder', 'Not set, default is used');
        $('#ip4_nameserver').attr('placeholder', 'Not set, default is used');
        $('#vlandata').attr('placeholder', 'Not set, default is used');
        $('#vlanmanagement').attr('placeholder', 'Not set, default is used');

    };

    var prepare_submit = function() {
        if (!LIB.validation.validateFields($('#system_config_dialog_form input:visible'))) {
            $('#system_config_warn').text('Correct highlighted fields.').show();
            return false;
        } else {
            $('#system_config_warn').hide().text('');
        }
        return true;
    };


    var init = function() {
        $("#system_config_dialog").dialog({
            position: 'top',
            modal: true,
            autoOpen: false,
            width: 'auto',
            minWidth: 500,
        });

        $('#system_config_warn').hide();
        $('#hardware_id').data('validator', LIB.validation.isTextLengthValid(64, 5));
        $('#name').data('validator', LIB.validation.isTextLengthValid(256, 0));
        $('#location').data('validator', LIB.validation.isTextLengthValid(256, 0));
        $('#ip4_cidr').data('validator', LIB.validation.isIPv4StrictCidrSubnetValid);
        $('#ip4_gateway').data('validator', LIB.validation.isNullableIPValid);
        $('#ip4_nameserver').data('validator', LIB.validation.isNullableIPValid);
        $('#vlandata').data('validator', LIB.validation.isVlanIdValid);
        $('#vlanmanagement').data('validator', LIB.validation.isVlanIdValid);
        $('#geolocation').data('validator', LIB.validation.isGpsCoordinats);
        UBD.MapSet.init();
    };

    return {
        init: init,
        resetForm: resetForm,
        addSystemConfig: addSystemConfig,
        displayError: displayError,
        prepare_submit: prepare_submit
    };

}();

UBD.MapSet = function () {

    var data = UBD.pageData.geoDialog;
    var map_source = UBD.pageData.map_source;
    var map_center = UBD.pageData.map_center;
     var map = new L.map('map', {
         maxZoom: 14,
         minZoom: 8,
         maxBounds: [
             [29.39, 34.17],
             [34.77, 37.55]
         ],
     }).setView(map_center, 8);

     var tileLayer = L.tileLayer(map_source,
         {
             attribution: 'Tiles by <a href="http://PeerApp.com">PeerApp</a>, Data by <a href="http://PeerApp.com">PeerApp</a>',
         });
     tileLayer.addTo(map);
     L.Icon.Default.imagePath='../maps/';
     var popup = new L.popup();

     var point = function onMapClick(e) {
         popup
             .setLatLng(e.latlng)
             .setContent("You selected point on the map " + e.latlng.toString())
             .openOn(map);
         $('#geolocation').val(e.latlng.lng.toString() + ", " + e.latlng.lat.toString());
     };

     map.on('dblclick', point);

     var options = {
         position: 'topright',
         title: 'UB-RAN',
         placeholder: 'Find on map',
         maxResultLength: 7,
         threshold: 0.2,
         showInvisibleFeatures: false,
         showResultFct: function (feature, container) {
             var props = feature.properties,
                 name = L.DomUtil.create('b', null, container);
             name.innerHTML = props.name;

             container.appendChild(L.DomUtil.create('br', null, container));
             container.appendChild(document.createTextNode(props.loc));
             container.appendChild(L.DomUtil.create('br', null, container));
             container.appendChild(document.createTextNode(props.hardware_id));
         }
     };

     var fuseSearchCtrl = L.control.fuseSearch(options);
     fuseSearchCtrl.indexFeatures(data.features, ['name', 'loc', 'hardware_id']);
     map.addControl(fuseSearchCtrl);

     var geoJsonLayer = L.geoJson(data, {onEachFeature: popUps});

     var markers = new L.MarkerClusterGroup({disableClusteringAtZoom: 14});
     markers.addLayer(geoJsonLayer);
     map.addLayer(markers);

     function popUps(feature, layer) {

       feature.layer = layer;
       layer.iddev = feature.properties.id;
       layer.bindPopup('Name: ' + '<a href="' + feature.properties.id + '" target="_blank" class="map-popup-link">' + feature.properties.name + '</a> </br>'
                + 'Position: ' + '<a href="' + feature.properties.id + '" target="_blank" class="map-popup-link">' + feature.properties.loc + '</a>');
     }
    function groupClick(event) {
         UBD.ACSConfig.editSystemConfig(event.layer.iddev);
     }
     markers.on("click", groupClick);

     function find_item(id) {
         map.invalidateSize();
         map.setView(map_center, 8);
         for (var i in geoJsonLayer._layers) {
             var props = geoJsonLayer._layers[i];
             if (props.iddev == id) {
                 map.setView(props._latlng, 14);
                 props.feature.layer.openPopup();
             }
         }
     }
     function closePopups() {
         map.invalidateSize();
         map.closePopup();
     }
     var init = function () {
         map.invalidateSize();
     };
     return {
         init: init,
         point: point,
         groupClick: groupClick,
         popUps: popUps,
         find_item: find_item,
         closePopups: closePopups
     }


}();


$(function() {
    UBD.ACSConfig.init();
    UBD.ACSConfigDialog.init();
});

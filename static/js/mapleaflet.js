(function (pub, $, undefined) {

        var data = UBD.pageData.geoDialog;
        var loaded_config = $('#system_config_dialog_form').toDeepJson({
                    convert_types: false
                });

        var map_source = UBD.pageData.map_source;
        var map_center = UBD.pageData.map_center;
        var map = new L.map('map', {
            maxZoom: 18,
            minZoom: 3
        }).setView(map_center, 8);

        mapLink =
            '<a href="http://openstreetmap.org">OpenStreetMap</a>, Data by <a href="http://PeerApp.com">PeerApp</a>';
        L.tileLayer(
            map_source, {
                attribution: '&copy; ' + mapLink + ' Contributors',
                maxZoom: 18
            }).addTo(map);


        L.Icon.Default.imagePath = location.protocol+ '//' +location.host + '/maps';

        L.Util.requestAnimFrame(map.invalidateSize, map, false, map._container);
        var popup = L.popup();

        var onMapClick = function (e) {
            popup
                .setLatLng(e.latlng)
                .setContent("You clicked the map at " + e.latlng.toString())
                .openOn(map);
            $('#geolocation').val(e.latlng.lng.toString() + ", " + e.latlng.lat.toString());
        };

        map.on('dblclick', onMapClick);

        var geoJsonLayer = L.geoJson(data, {onEachFeature: popUps});
        var markers = new L.MarkerClusterGroup();
        markers.addLayer(geoJsonLayer);
        map.addLayer(markers);

        function popUps(feature, layer) {
            feature.layer = layer;
            layer.bindPopup('Name: ' + '<a href="' + feature.properties.id + '" target="_blank" class="map-popup-link">' + feature.properties.name + '</a> </br>'
                + 'Position: ' + '<a href="' + feature.properties.id + '" target="_blank" class="map-popup-link">' + feature.properties.loc + '</a>');
            layer.iddev = feature.properties.id;


            layer.on('click', function () {
                sidebar.open('settings');
                resetForm();
                layer.openPopup();
                editSystemConfig(feature.properties.id);

            });

        };

        L.Control.Sidebar = L.Control.extend({
            includes: L.Mixin.Events,

            options: {
                position: 'left'
            },

            initialize: function (id, options) {
                var i, child;

                L.setOptions(this, options);


                this._sidebar = L.DomUtil.get(id);


                L.DomUtil.addClass(this._sidebar, 'sidebar-' + this.options.position);


                if (L.Browser.touch)
                    L.DomUtil.addClass(this._sidebar, 'leaflet-touch');


                for (i = this._sidebar.children.length - 1; i >= 0; i--) {
                    child = this._sidebar.children[i];
                    if (child.tagName == 'DIV' &&
                        L.DomUtil.hasClass(child, 'sidebar-content'))
                        this._container = child;
                }


                this._tabitems = this._sidebar.querySelectorAll('ul.sidebar-tabs > li, .sidebar-tabs > ul > li');
                for (i = this._tabitems.length - 1; i >= 0; i--) {
                    this._tabitems[i]._sidebar = this;
                }


                this._panes = [];
                this._closeButtons = [];
                for (i = this._container.children.length - 1; i >= 0; i--) {
                    child = this._container.children[i];
                    if (child.tagName == 'DIV' &&
                        L.DomUtil.hasClass(child, 'sidebar-pane')) {
                        this._panes.push(child);

                        var closeButtons = child.querySelectorAll('.sidebar-close');
                        for (var j = 0, len = closeButtons.length; j < len; j++)
                            this._closeButtons.push(closeButtons[j]);
                    }
                }
            },

            addTo: function (map) {
                var i, child;

                this._map = map;

                for (i = this._tabitems.length - 1; i >= 0; i--) {
                    child = this._tabitems[i];
                    L.DomEvent
                        .on(child.querySelector('a'), 'click', L.DomEvent.preventDefault)
                        .on(child.querySelector('a'), 'click', this._onClick, child);
                }

                for (i = this._closeButtons.length - 1; i >= 0; i--) {
                    child = this._closeButtons[i];
                    L.DomEvent.on(child, 'click', this._onCloseClick, this);
                }

                return this;
            },


            removeFrom: function (map) {
                var i, child;

                this._map = null;

                for (i = this._tabitems.length - 1; i >= 0; i--) {
                    child = this._tabitems[i];
                    L.DomEvent.off(child.querySelector('a'), 'click', this._onClick);
                }

                for (i = this._closeButtons.length - 1; i >= 0; i--) {
                    child = this._closeButtons[i];
                    L.DomEvent.off(child, 'click', this._onCloseClick, this);
                }

                return this;
            },

            open: function (id) {
                var i, child;


                for (i = this._panes.length - 1; i >= 0; i--) {
                    child = this._panes[i];
                    if (child.id == id)
                        L.DomUtil.addClass(child, 'active');
                    else if (L.DomUtil.hasClass(child, 'active'))
                        L.DomUtil.removeClass(child, 'active');
                }


                for (i = this._tabitems.length - 1; i >= 0; i--) {
                    child = this._tabitems[i];
                    if (child.querySelector('a').hash == '#' + id)
                        L.DomUtil.addClass(child, 'active');
                    else if (L.DomUtil.hasClass(child, 'active'))
                        L.DomUtil.removeClass(child, 'active');
                }

                this.fire('content', {id: id});


                if (L.DomUtil.hasClass(this._sidebar, 'collapsed')) {
                    this.fire('opening');
                    L.DomUtil.removeClass(this._sidebar, 'collapsed');
                }
                return this;

            },


            close: function () {

                for (var i = this._tabitems.length - 1; i >= 0; i--) {
                    var child = this._tabitems[i];
                    if (L.DomUtil.hasClass(child, 'active'))
                        L.DomUtil.removeClass(child, 'active');
                }


                if (!L.DomUtil.hasClass(this._sidebar, 'collapsed')) {
                    this.fire('closing');
                    L.DomUtil.addClass(this._sidebar, 'collapsed');
                }

                return this;
            },

            _onClick: function () {
                if (L.DomUtil.hasClass(this, 'active'))
                    this._sidebar.close();
                else if (!L.DomUtil.hasClass(this, 'disabled'))
                    this._sidebar.open(this.querySelector('a').hash.slice(1));
            },

            _onCloseClick: function () {
                this.close();
            }
        });


        L.control.sidebar = function (id, options) {
            return new L.Control.Sidebar(id, options);
        };

        $.fn.sidebar = function (options) {
            var $sidebar = this;
            var $tabs = $sidebar.find('ul.sidebar-tabs, .sidebar-tabs > ul');
            var $container = $sidebar.children('.sidebar-content').first();

            options = $.extend({
                position: 'left'
            }, options || {});

            $sidebar.addClass('sidebar-' + options.position);

            $sidebar.find('.menutab').on('click', function (e) {
                e.preventDefault();
                var $tab = $(this).closest('li');

                if ($tab.hasClass('active'))
                    $sidebar.close();
                else if (!$tab.hasClass('disabled'))
                    $sidebar.open(this.hash.slice(1), $tab);
            });

            $sidebar.find('.sidebar-close').on('click', function () {
                $sidebar.close();
            });

            $sidebar.open = function (id, $tab) {

                if (typeof $tab === 'undefined')
                    $tab = $tabs.find('li > a[href="#' + id + '"]').parent();

                $container.children('.sidebar-pane.active').removeClass('active');

                ('#' + id).addClass('active');

                $tabs.children('li.active').removeClass('active');

                $tab.addClass('active');

                $sidebar.trigger('content', {'id': id});

                if ($sidebar.hasClass('collapsed')) {
                    $sidebar.trigger('opening');
                    $sidebar.removeClass('collapsed');
                }
            };

            $sidebar.close = function () {
                $tabs.children('li.active').removeClass('active');

                if (!$sidebar.hasClass('collapsed')) {
                    // close sidebar
                    $sidebar.trigger('closing');
                    $sidebar.addClass('collapsed');
                }
            };

            return $sidebar;
        };
        var sidebar = L.control.sidebar('sidebar', {position: 'right'}).addTo(map);


        L.Control.FuseSearch = L.Control.extend({

            includes: L.Mixin.Events,

            options: {
                position: 'topright',
                title: 'Search',
                panelTitle: '',
                placeholder: 'Search',
                caseSensitive: false,
                threshold: 0.5,
                maxResultLength: null,
                showResultFct: null,
                showInvisibleFeatures: true
            },

            initialize: function (options) {
                L.setOptions(this, options);
                this._panelOnLeftSide = (this.options.position.indexOf("left") !== -1);
            },

            onAdd: function (map) {

                this._createPanel(map);
                this._setEventListeners();
                map.invalidateSize();

            },

            onRemove: function (map) {

                this.hidePanel(map);
                this._clearEventListeners();
                this._clearPanel(map);
                this._clearControl();

                return this;
            },


            _createPanel: function (map) {
                var _this = this;
                var mainpanel = L.DomUtil.get('search');
                var className = 'leaflet-fusesearch-panel',
                    pane = this._panel = L.DomUtil.create('div', className, mainpanel);


                var stop = L.DomEvent.stopPropagation;
                L.DomEvent.on(pane, 'click', stop)
                    .on(pane, 'dblclick', stop)
                    .on(pane, 'mousedown', stop)
                    .on(pane, 'touchstart', stop)
                    .on(pane, 'mousewheel', stop)
                    .on(pane, 'MozMousePixelScroll', stop);

                if (this._panelOnLeftSide) {
                    L.DomUtil.addClass(pane, 'left');
                } else {
                    L.DomUtil.addClass(pane, 'right');
                }

                var container = L.DomUtil.create('div', 'content', pane);

                var header = L.DomUtil.create('div', 'header', container);
                if (this.options.panelTitle) {
                    var title = L.DomUtil.create('p', 'panel-title', header);
                    title.innerHTML = this.options.panelTitle;
                }

                L.DomUtil.create('i', 'fa fa-search', header);
                this._input = L.DomUtil.create('input', 'searchs-input', header);
                this._input.maxLength = 30;
                this._input.placeholder = this.options.placeholder;
                this._input.onkeyup = function (evt) {
                    var searchString = evt.currentTarget.value;
                    _this.searchFeatures(searchString);
                };

                var close = this._closeButton = L.DomUtil.create('a', 'fa fa-eraser', header);
                L.DomEvent.on(close, 'click', function (e) {
                    $('.searchs-input').val('');
                    $('.result-list').empty();
                }, this);

                this._resultList = L.DomUtil.create('div', 'result-list', container);

                return pane;
            },

            _clearPanel: function (map) {

                var stop = L.DomEvent.stopPropagation;
                L.DomEvent.off(this._panel, 'click', stop)
                    .off(this._panel, 'dblclick', stop)
                    .off(this._panel, 'mousedown', stop)
                    .off(this._panel, 'touchstart', stop)
                    .off(this._panel, 'mousewheel', stop)
                    .off(this._panel, 'MozMousePixelScroll', stop);

                L.DomEvent.off(this._closeButton, 'click', this.hidePanel);

                var mapContainer = map.getContainer();
                mapContainer.removeChild(this._panel);

                this._panel = null;
            },

            _setEventListeners: function () {
                var that = this;
                var input = this._input;
                this._map.addEventListener('overlayadd', function () {
                    that.searchFeatures(input.value);
                });
                this._map.addEventListener('overlayremove', function () {
                    that.searchFeatures(input.value);
                });
            },

            _clearEventListeners: function () {
                this._map.removeEventListener('overlayadd');
                this._map.removeEventListener('overlayremove');
            },

            isPanelVisible: function () {
                return L.DomUtil.hasClass(this._panel, 'visible');
            },

            showPanel: function () {
                if (!this.isPanelVisible()) {
                    L.DomUtil.addClass(this._panel, 'visible');
                    this._map.panBy([this.getOffset() * 0.5, 0], {duration: 0.5});
                    this.fire('show');
                    this._input.select();
                    this.searchFeatures(this._input.value);
                }
            },

            hidePanel: function (e) {
                if (this.isPanelVisible()) {
                    L.DomUtil.removeClass(this._panel, 'visible');
                    if (null !== this._map) {
                        this._map.panBy([this.getOffset() * -0.5, 0], {duration: 0.5});
                    }
                    ;
                    this.fire('hide');
                    if (e) {
                        L.DomEvent.stopPropagation(e);
                    }
                }
            },

            getOffset: function () {
                if (this._panelOnLeftSide) {
                    return -this._panel.offsetWidth;
                } else {
                    return this._panel.offsetWidth;
                }
            },

            indexFeatures: function (data, keys) {

                var jsonFeatures = data.features || data;

                this._keys = keys;
                var properties = jsonFeatures.map(function (feature) {
                    feature.properties._feature = feature;
                    return feature.properties;
                });

                var options = {
                    keys: keys,
                    caseSensitive: this.options.caseSensitive,
                    threshold: this.options.threshold
                };

                this._fuseIndex = new Fuse(properties, options);
            },

            searchFeatures: function (string) {

                var result = this._fuseIndex.search(string);

                var listItems = document.querySelectorAll(".result-item");
                for (var i = 0; i < listItems.length; i++) {
                    listItems[i].remove();
                }

                var resultList = document.querySelector('.result-list');
                var num = 0;
                var max = this.options.maxResultLength;
                for (var i in result) {
                    var props = result[i];
                    var feature = props._feature;
                    var popup = this._getFeaturePopupIfVisible(feature);
                    if (!popup || this.options.showInvisibleFeatures) {
                        this.createResultItem(props, resultList, popup);
                        if (!max && ++num === max)
                            break;
                    }
                }
            },

            refresh: function () {
                if (this.isPanelVisible()) {
                    this.searchFeatures(this._input.value);
                }
            },

            _getFeaturePopupIfVisible: function (feature) {
                var layer = feature.layer;
                if (undefined !== layer && this._map.hasLayer(layer)) {
                    return layer.getPopup();
                }
            },

            createResultItem: function (props, container) {

                var feature = props._feature;
                var resultItem = L.DomUtil.create('p', 'result-item', container);

                L.DomUtil.addClass(resultItem, 'clickable');
                resultItem.onclick = function () {
                        map.setView(feature.layer._latlng,18);
                        sidebar.open('settings');
                        resetForm();
                        editSystemConfig(feature.properties.id);

                        feature.layer.openPopup();
                };


                if (null !== this.options.showResultFct) {
                    this.options.showResultFct(feature, resultItem);
                } else {
                    str = '<b>' + props[this._keys[0]] + '</b>';
                    for (var i = 1; i < this._keys.length; i++) {
                        str += '<br/>' + props[this._keys[i]];
                    }
                    resultItem.innerHTML = str;
                };

                return resultItem;
            }

        });

        L.control.fuseSearch = function (options) {
            return new L.Control.FuseSearch(options);
        };


        var resetForm = function () {
            LIB.validation.resetFieldsErrors($('#system_config_dialog_form input'));
            $("#system_config_dialog_form")[0].reset();
            $('#system_config_warn').hide().text('');
            $('#ip4_gateway').attr('placeholder', 'Not set, default is used');
            $('#ip4_nameserver').attr('placeholder', 'Not set, default is used');
            $('#vlandata').attr('placeholder', 'Not set, default is used');
            $('#vlanmanagement').attr('placeholder', 'Not set, default is used');


        };

        var validateForm = function () {
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
        };

        var displayError = function (jqXHR, textStatus, errorThrown) {
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
        var prepare_submit = function () {
            if (!LIB.validation.validateFields($('#system_config_dialog_form input:visible'))) {
                $('#system_config_warn').text('Correct highlighted fields.').show();
                return false;
            } else {
                $('#system_config_warn').hide().text('');
            }
            return true;
        };

        var editSystemConfig = function (id) {
            apiurl = $('#system_config_dialog_form').data('url') + '/' + id;
            $('#formlayout').data('url', apiurl);

            $.get(apiurl, function (data) {
                $('#formlayout').data('url', apiurl);
                validateForm();
                $('#system_config_warn').hide().text('');
                for (var key in data) {
                    if (data[key] && data[key].length == 0 && $('#d_' + key).length) {
                        $('#' + key).attr('placeholder', 'Not set. Default is used');
                    }
                    else {
                        $('#' + key).val(data[key]);
                    }

                }


                check_state_button();
                $("#cancel_btn")
                    .button({label: "Cancel"})
                    .click(function (e) {
                        resetForm();
                        sidebar.close();
                    });
            });
        };


        var check_state_button = function () {

            if ($('#formlayout').data('url') != $('#system_config_dialog_form').data('url')) {
                $("#add_btn").hide();
                $("#edit_btn")
                    .button({label: "Save"})
                    .show()
                    .click(function (e) {
                        if (!prepare_submit()) {
                            return;
                        }
                        var params = $('#system_config_dialog_form').toDeepJson({
                            convert_types: false
                        });

                        if (LIB.isEqual(loaded_config, params)) {
                            $('#system_config_warn').text("You don't  add any chandes.").show();
                            return;
                        }

                        apiurl = $('#formlayout').data('url');

                        UBD.API.update({
                            url: apiurl,
                            data: params,
                            error: displayError,
                            auto_lock_ui: true
                        });
                        e.stopImmediatePropagation();
                    });

                $("#delete_btn")
                    .show()
                    .button({label: "Delete"})
                    .click(function (e) {

                        apiurl = $('#formlayout').data('url');
                        UBD.API.delet({
                            url: apiurl,
                            error: displayError,
                            auto_lock_ui: true
                        });

                    });
            }

            else {
                $("#delete_btn").hide();
                $("#edit_btn").hide();
                $("#add_btn")
                    .button({label: "Add"})
                    .show()
                    .click(function (e) {
                        validateForm();
                        if (!prepare_submit()) {
                            return;
                        }
                        var form = $("#system_config_dialog_form");
                        var url = form.data('url');
                        $('#formlayout').data('url', url);
                        var req = form.toDeepJson({
                            convert_types: false
                        });
                        UBD.API.create({
                            url: url,
                            data: req,
                            auto_lock_ui: true,
                            error: displayError
                        });
                        e.stopImmediatePropagation()
                    });
            }
        };

        var addSystemConfig = function () {
            $("#system_config_warn").hide().text("");
            $("#system_config_dialog * label").removeClass('ui-state-error');
            var url = $('#system_config_dialog_form').data('url');
            $('#formlayout').data('url', url);
            check_state_button();

            $("#cancel_btn")
                .button({label: "Cancel"})
                .click(function (e) {
                    resetForm();
                    sidebar.close();
                });
        };


        $("a[href^='#settings']").click(function () {
            resetForm();
            addSystemConfig();
        });

        var fuseSearchCtrl = L.control.fuseSearch();
        fuseSearchCtrl.indexFeatures(data.features, ['name', 'loc', 'hardware_id']);
        map.addControl(fuseSearchCtrl);



 })(UBD.MapCrud  = UBD.MapCrud || {}, jQuery);
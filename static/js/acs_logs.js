UBD.ACSLogs = function () {
    var init = function() {
        UBD.dataTable.init('#acs_logs', {
            "bSortCellsTop": true,
            "bServerSide": true,
            "bProcessing": true,
            "sAjaxSource": $('#acs_logs').data('url'),
            "sDom":'tr<"datatable_footer"ilp>',
            "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
                $(nRow).attr("id", aData[0]);
                return nRow;
            },
            "bLengthChange": true,
            "bFilter": true,
            "bAutoWidth": false,
            "aaSorting": [ [ 0, "desc"] ],
            "oLanguage": {
                "sProcessing": "Loading… " + UBD.misc.ajaxLoadingGifHtml(),
                sEmptyTable : "There are no events at the moment",
                "sLengthMenu": 'Display <select>'+
                '<option value="25">25</option>'+
                '<option value="50">50</option>'+
                '<option value="100">100</option>'+
                '<option value="200">200</option>'+
                '</select> records'
            },
            "asStripeClasses": [ 'ubd-evenrow', 'ubd-oddrow' ],
            "iDisplayLength": 25,
            "aoColumnDefs": [
                { "sClass": "datetime", "aTargets": [ "datetime" ] },
            ]
        }, true, true);

        UBD.watchManager.watch(UBD.pageData.acs_watch_uri, function(data, serial) {
            for (var item in data) {
                var events = item == 'events' ? data[item] : data[item].events;
                if (!events)
                    continue;
                for (var i=0; i < events.length; ++i) {
                    var evt = events[i];
                    if (evt.serial >= serial) {
                        if (evt['event']['acs_events']) {
                            $('#acs_logs').dataTable().fnDraw();
                            break;
                        }
                    }
                }
            }
        });
    };

    return {
        init: init
    };
}();

$(function() {
    UBD.ACSLogs.init();
});

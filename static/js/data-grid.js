// Boilerplate code copied from ag-grid documentation
// https://www.ag-grid.com/javascript-grid-infinite-scrolling/

var columnDefs = [
    {headerName: "ID", width: 55,
        valueGetter: 'node.id',
        cellRenderer: 'loadingRenderer'
    },
    {headerName: "Name", field: "name", width: 100},
    {headerName: "Email", field: "email", width: 120},
    {headerName: "Company", field: "company", width: 120},
    {headerName: "City", field: "city", width: 90},
    {headerName: "Country", field: "country", width: 110},
    {headerName: "Job History", field: "job_history", width: 180},
];

// TODO: find a better place to put config variables
var blockSize = 20;

var gridOptions = {
    components:{
        loadingRenderer: function(params) {
            if (params.value !== undefined) {
                return params.value;
            } else {
                return '<img src="/static/img/loading.gif">'
            }
        }

    },
    enableColResize: true,
    rowBuffer: 0,
    cacheBlockSize: blockSize,
    cacheOverflowSize: 3,
    debug: true,
    rowSelection: 'multiple',
    rowDeselection: true,
    columnDefs: columnDefs,
    rowModelType: 'infinite',
    infiniteInitialRowCount: 1,
};

// Initialise the grid after the page has finished loading
document.addEventListener('DOMContentLoaded', function() {
    var gridDiv = document.querySelector('#results-grid');
    new agGrid.Grid(gridDiv, gridOptions);
    updateAgGrid();
});

// Update the data source when the inputs change
document.getElementById('search-query').onchange = function() {
    updateAgGrid();
};
document.getElementById('search-field').onchange = function() {
    updateAgGrid();
};

function updateAgGrid() {
    function DataSource() {
        this.getRows = function (params) {
            var query = document.getElementById('search-query').value;
            var field = document.getElementById('search-field').value;
            // Calculate the page offset
            var offset = (params.endRow / blockSize) -1;

            // construct query string
            query_params = '?' + 'query=' + query + '&offset=' + offset;
            if (field !== 'all') {
                query_params += '&field=' + field;
            }

            // query search API
            var request = new XMLHttpRequest();
            request.open('GET', 'search' + query_params, true);
            request.onreadystatechange = function () {
                if (request.readyState == 4 && request.status == 200) {
                    var responseData = JSON.parse(request.responseText);
                    var rowsThisPage = responseData['results'];

                    // if on or after the last page, set the last row.
                    var lastRow = -1;
                    if (responseData['total'] <= params.endRow) {
                        lastRow = responseData['total'];
                    }

                    // call the success callback
                    params.successCallback(rowsThisPage, lastRow);
                }
            }
            request.send();

        }
    }

    var dataSourceInstance = new DataSource();

    gridOptions.api.setDatasource(dataSourceInstance);

}
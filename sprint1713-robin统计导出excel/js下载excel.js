    <script language="JavaScript" type="text/javascript">
        function toExcel() {
			var tableNode = document.getElementsByTagName('table');
			tableNode = tableNode[0];
			var explorer = window.navigator.userAgent;
            if(explorer.indexOf("MSIE")>= 0 || explorer.indexOf("Trident")>= 0 || explorer.indexOf(".NET CLR") >= 0)
            {tableToExcelTrident(tableNode);}
            else
            {tableToExcelGecko(tableNode);}
        }
        var tableToExcelTrident = function(tableNode)
        {
			var curTbl = tableNode;
            var oXL = new ActiveXObject("Excel.Application");
            var oWB = oXL.Workbooks.Add();
            var oSheet = oWB.ActiveSheet;
            var Lenr = curTbl.rows.length;
            for (i = 0; i < Lenr; i++)
            {        var Lenc = curTbl.rows(i).cells.length;
                for (j = 0; j < Lenc; j++)
                {
                    oSheet.Cells(i + 1, j + 1).value = curTbl.rows(i).cells(j).innerText;
                }

            }
            oXL.Visible = true;
        }
        var tableToExcelGecko = (function() {
            var uri = 'data:application/vnd.ms-excel;base64,',
                    template = '<html><head><meta charset="UTF-8"></head><body><table>{table}</table></body></html>',
                    base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) },
                    format = function(s, c) {
                        return s.replace(/{(\w+)}/g,
                                function(m, p) { return c[p]; }) }
            return function(tableNode, name) {
				var tableNArray = document.getElementsByTagName('table');
				tableN = tableNArray[0];
                var ctx = {worksheet: name || 'Worksheet', table: eval("tableNode.innerHTML")}
                window.location.href = uri + base64(format(template, ctx))
            }
        })()
    </script>
删除不合格的设计后，合格的数目减少？

1. what happened when Delete Unqualified Design?
put fpmw/api/rest/v1.0/asset/' + templateId + '/status/2
patch ${content.api.base}"/v1.0/asset/:assetId"
     body: {"status":2}
     updateAsset to MysqlDB; and sendToIndexer to update elasticSearch index
	 
2. how to search Qualified Design?
Post https://uat-fpmw.shejijia.com/api/rest/v1.0/tenant/ezhome/asset/search
     body {
     	"userIds": [],
     	"attributes": ["auditStatus_1"],
     	"fieldsToStat": [],
     	"assetType": [4, 6],
     	"offset": 0,
     	"limit": 10,
     	"sortField": "lastTimeModified",
     	"sortOrder": "desc"
     }
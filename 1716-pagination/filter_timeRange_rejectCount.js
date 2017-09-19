<div class="row result-num">
    <span class="text">{{'manageproduct-searchnum'| translate}}：</span>
    <span class="num-size">{{totalProductsCount}}</span>
    <div class="pull-right">
      <select name="auditRange" ng-model="data.auditRange" ng-change="onAuditRangeChanged();" class="single-select">
        <option value="showAll">{{'show_all_audit' | translate}}</option>
        <option value="showToday">{{'show_today_audit' | translate}}</option>
      </select>
    </div>
</div>

$scope.data = { 'auditRange': 'showAll' };//initialize param $scope.data.auditRange

$scope.auditorFilter = [];
$scope.onAuditRangeChanged = function() {
    $scope.currentPage = 0;
    if($scope.data.auditRange == "showToday"){
        $scope.auditorFilter = ["auditorId_" + $scope.user.userId];
    }
    else
        $scope.auditorFilter = [];
    $scope.refreshSearchResults(true);
}

if($scope.data.auditRange == "showToday"){
    data['timeField'] = "auditTime";
    data['timeRange'] = generalTimeRange;
}


//scala code~
//fp middleware
private def mergeAssetAttributes(asset: Asset, optionsToPatch: JsObject,
                                     auditActionOption: Option[List[AssetAuditAction]] = None,
                                     optionsToRemove: Option[List[String]] = None): List[AssetAttribute] = {
      def isAuditAction(lastAction: AssetAuditAction): Boolean = {
        lastAction.action == AssetAuditActionType.Approve || lastAction.action == AssetAuditActionType.Reject
      }
      def getAuditorId(lastAction: AssetAuditAction): Option[String] = {
        if(isAuditAction(lastAction)) {
          Some(lastAction.userId)
        } else {
          None
        }
      }

      val attributeHead = asset.attributes.head
      val attributeFreeObj = Json.parse(attributeHead.free.head).as[JsObject]

      val allOptionsToPatch = if(auditActionOption.nonEmpty) {
        val auditActions = auditActionOption.get
        val newStatus = AssetAuditStatus.getStatus(auditActions.last.action)
        val newAuditorId = getAuditorId(auditActions.last)

        val auditOption: Option[AssetAudit] = (attributeFreeObj \ "audit").asOpt[AssetAudit]
        val timeStamp = System.currentTimeMillis() / 1000L   //save submit or audit time to asset(template)
        val updatedAudit: AssetAudit = if (auditOption.nonEmpty) {
          val auditorId = newAuditorId match {
            case Some(id) => id
            case None => auditOption.get.auditorId
          }
          val logs = auditOption.get.logs ++ auditActions
          val rejectCount = logs.count(_.action == AssetAuditActionType.Reject)//count reject times, record to rejectCount
          if(isAuditAction(auditActions.last)){
            auditOption.get.copy(status = newStatus, auditorId = auditorId, logs = logs, rejectCount = Some(rejectCount), auditTime = Some(timeStamp))
          }else{
            auditOption.get.copy(status = newStatus, auditorId = auditorId, logs = logs, rejectCount = Some(rejectCount), submitTime = Some(timeStamp))
          }

        } else {
          val auditorId = newAuditorId match {
            case Some(id) => id
            case None => ""
          }
          AssetAudit(status = newStatus, auditorId = auditorId, logs = auditActions, rejectCount = Some(0), submitTime = Some(timeStamp))
        }

        optionsToPatch ++ Json.obj("audit" -> Json.toJson(updatedAudit))
      } else {
        optionsToPatch
      }

      var newAttributeFreeObj = attributeFreeObj ++ allOptionsToPatch
      if(optionsToRemove.nonEmpty) {
        optionsToRemove.get.map { field =>
          newAttributeFreeObj = attributeFreeObj - field
        }
      }

      List(AssetAttribute(typeId = attributeHead.typeId, values = attributeHead.values, free = List((newAttributeFreeObj).toString)))
    }
//cms
//search service
override def assetQuery(tenant: String,
                           terms: List[String],
                           blockedTerms: List[String],
                           userIds: Option[List[String]] = None,
                           status: Option[List[Int]] = None,
                           assetType: Option[List[Int]] = None,
                           attributes: List[(String, String)],
                           modifiedTimeRange: Option[String],
                           timeRange: Option[String],
                           timeField: Option[String],
                           enableFuzzy: Boolean): String = {

      val tenantTermsQuery =  s"""{"term":{"tenant":"${tenant}"}}"""

      val termsQuery = enableFuzzy match {
        case true =>
          terms.map(t => {
            val tFuzzy = t + "~"
            s"""{"query_string":{"query":"$tFuzzy","fields":["attributes.neighborName"],"fuzzy_prefix_length" : 3}}"""
          }).mkString(",")
        case _ =>
          terms.map(t => s"""{"query_string":{"query":"$t","fields":["attributes.neighborName"]}}""").mkString(",")
      }
      val termsQueryWithComma = if (!termsQuery.isEmpty) ", " + termsQuery else ""

      val blockedTermsQuery = ""//blockedTerms.map(t => s"""{"query_string":{"query":"$t","fields":["attributes.neighborName"]}}""").mkString(",")

      val statusQuery = QueryBuilderUtility.intLstQuery(status.getOrElse(List.empty), "status")

      val assetTypeQuery = QueryBuilderUtility.intLstQuery(assetType.getOrElse(List.empty), "assetType")

      val userIdQuery = QueryBuilderUtility.lstQuery(userIds.getOrElse(List.empty[String]), "userId")

      def attributeTerm(a: (String, String)) = if (a._2.nonEmpty) {
        val prefix = if(RoomType.isRoomType(a._1)) "attributes.roomNumbers." else "attributes."
        s"""{"term":{"${prefix}${a._1}": "${a._2}"}}"""
      } else ""
      val attributesQueryList = attributes.groupBy(_._1).map(a => if (a._2.isEmpty) "" else s"""{"or": [${a._2.map(attributeTerm).mkString(",")}]}""")
      val attributesQuery = attributesQueryList.filterNot(_.isEmpty).mkString(",")

      val timeRangeQuery: Option[String] = modifiedTimeRange match {
        case Some(p) => {
          Logger.info("parse product lastTimeModified range "+ p)
          try{
            val rangeArray = p.toLowerCase().trim().split(",")
            val allRanges = rangeArray.map { s => strToDateRange(s) }.toList
            Some(allRanges.map{t=>
              """{"range":{"lastTimeModified":{"gte":%d,"lte":%d}}}""".format(t._1, t._2)
            }.mkString(","))
          }
          catch{
            case t: Throwable => {
              Logger.error("wrong lastTimeModified range")
              throw t
            }
          }
        }
        case _ =>
          Logger.info("no product lastTimeModified range ")
          None
      }

      val timeRangeFilterWithComma = timeRangeQuery match {
        case Some(r) =>
          """ {"or":[%s]} """.format(r)
        case None => ""
      }

      val generalTimeRangeQuery: Option[String] = timeField match{
        case Some(p) => {
          timeRange match {
            case Some(p) => {
              Logger.info("parse asset general time range "+ p)
              try{
                val rangeArray = p.toLowerCase().trim().split(",")
                val allRanges = rangeArray.map { s => strToDateRange(s) }.toList
                Some(allRanges.map{t=>
                  """{"range":{"%s":{"gte":%d,"lte":%d}}}""".format(timeField.getOrElse("UNKNOWN_FIELD"), t._1, t._2)
                }.mkString(","))
              }
              catch{
                case t: Throwable => {
                  Logger.error("wrong general time range")
                  throw t
                }
              }
            }
            case _ =>
              Logger.info("no  asset general time range ")
              None
          }
        }
        case _ =>
          Logger.info("no  asset general time field ")
          None
      }
      val generalTimeRangeFilterWithComma = generalTimeRangeQuery match {
        case Some(r) =>
          """ {"or":[%s]} """.format(r)
        case None => ""
      }

      val filter = if (statusQuery.isEmpty && assetTypeQuery.isEmpty && userIdQuery.isEmpty && attributesQuery.isEmpty && timeRangeFilterWithComma.isEmpty && generalTimeRangeFilterWithComma.isEmpty) ""
      else s""","filter": {
              |        "bool": {
              |          "must": [
              |           ${List(statusQuery, assetTypeQuery, userIdQuery, attributesQuery, timeRangeFilterWithComma, generalTimeRangeFilterWithComma).filterNot(_.isEmpty).mkString(",")}
              |          ]
              |        }
              |      }
           """.stripMargin

      val result = s"""
                      |{ "filtered": {
                      |      "query": {
                      |        "bool": {
                      |          "must_not" : [
                      |           $blockedTermsQuery
                      |          ],
                      |          "must": [
                      |          $tenantTermsQuery
                      |          $termsQueryWithComma
                      |          ],
                      |         "minimum_should_match": 1
                      |        }
                      |      }
                      |      $filter
                      |    }
                      |  }
      """.stripMargin
      result
    }
//log of git bash ~
2017-09-19 14:46:27,565 INFO [play-akka.actor.default-dispatcher-128] application [LogUtil.scala:49] no product lastTimeModified range
2017-09-19 14:46:27,565 INFO [play-akka.actor.default-dispatcher-128] application [LogUtil.scala:49] 
						parse asset general time range 2017-09-19T00:00:00.000ZTO2017-09-19T23:59:59.000Z
2017-09-19 14:46:27,566 DEBUG [play-akka.actor.default-dispatcher-128] application [LogUtil.scala:61] {
  "from" : 0,
  "size" : 10, "query" :
{ "filtered": {
      "query": {
        "bool": {
          "must_not" : [

          ],
          "must": [
          {"term":{"tenant":"ezhome"}}

          ],
         "minimum_should_match": 1
        }
      }
      ,"filter": {
        "bool": {
          "must": [
           {"or": [ {"term": {"status": 1}},{"term": {"status": 5}},{"term": {"status": 4}} ]},{"or": [ {"term": {"assetType": 4}},{"term": {"assetType": 6}} ]}                 ,{"or": [{"term":{"attributes.auditorId": "4990ace5-82df-467a-9bbf-c0b84fe7f7fc"}}]},{"or": [{"term":{"attributes.auditStatus": "2"}}]}, {"or":[{"range":{"auditTime":{"gte":1505750400000,"lte":1505836799000}}}]}
          ]
        }
      }

    }
  }
      ,
  "sort" : [ {
    "lastTimeModified" : {
      "order" : "desc"
    }
  } ]
}
2017-09-19 14:46:27,602 DEBUG [ForkJoinPool-3-worker-3] application [LogUtil.sca                 la:67] event



//Indexer Service
private def convertAttributeIndexable(attribute: FullAssetAttribute): Option[AssetAttributeIndexable] = {
    val freeDataString = attribute.free.getOrElse(List.empty[String]).headOption
    if(freeDataString.nonEmpty) {
      val extraInfoAttribute = Json.parse(freeDataString.getOrElse("")).as[AssetExtraInfoAttribute]
      val provinceId = (extraInfoAttribute.province.get \ "id").asOpt[Int].getOrElse(0)
      val cityId = (extraInfoAttribute.city.get \ "id").asOpt[Int].getOrElse(0)
      val districtId = (extraInfoAttribute.district.get \ "id").asOpt[Int].getOrElse(0)
      val neighborOption = extraInfoAttribute.neighbor
      val neighborName = if(neighborOption.nonEmpty) {
        if(neighborOption.get.isInstanceOf[JsObject])
          (neighborOption.get \ "name").asOpt[String].getOrElse("")
        else
          // both input and select options are supported searching
          neighborOption.get.as[String]
      } else {
        ""
      }
      val roomNumbers = Map[String, Int](
        RoomType.bedroom -> parseRoomNum(extraInfoAttribute.bedroomNum.getOrElse(JsString("0"))),
        RoomType.bathroom -> parseRoomNum(extraInfoAttribute.livingroomNum.getOrElse(JsString("0"))),
        RoomType.livingroom -> parseRoomNum(extraInfoAttribute.bathroomNum.getOrElse(JsString("0"))))
      val styleOption = extraInfoAttribute.style
      val roomStyleCode = if(styleOption.nonEmpty && styleOption.get.isInstanceOf[JsObject]) {
        (extraInfoAttribute.style.get \ "code").asOpt[String].getOrElse("")
      } else {
        ""
      }
      val area: Double = parseDouble(extraInfoAttribute.area.getOrElse(JsString("0.0")))
      val grossArea: Double = parseDouble(extraInfoAttribute.grossArea.getOrElse(JsString("0.0")))
      val auditStatus = if(extraInfoAttribute.audit.nonEmpty) {
        Some(extraInfoAttribute.audit.get.status)
      } else {
        None
      }
      val auditorId = if(extraInfoAttribute.audit.nonEmpty) {
        Some(extraInfoAttribute.audit.get.auditorId.getOrElse(""))
      } else {
        None
      }	 
	  
	  //前台发送的请求 "timeField":"auditTime","timeRange":"2017-09-19T00:00:00.000ZTO2017-09-19T23:59:59.000Z"
	  //Search项目里把它转化成DateTime搜索
	  //
	  //s3 asset auditTime=1505802826
	  //indexer项目里把它转化成 org.joda.time.DateTime

      val submitTime = if(extraInfoAttribute.audit.nonEmpty) {
        Some(timeStampToDateTime(extraInfoAttribute.audit.get.submitTime.getOrElse(0L) * 1000L))
      } else {
        None
      }
      val auditTime = if(extraInfoAttribute.audit.nonEmpty) {
        Some(timeStampToDateTime(extraInfoAttribute.audit.get.auditTime.getOrElse(0L) * 1000L))
      } else {
        None
      }
      val rejectCount = if(extraInfoAttribute.audit.nonEmpty) {
        Some(extraInfoAttribute.audit.get.rejectCount.getOrElse(0))
      } else {
        None
      }
      Some(AssetAttributeIndexable(
        templateId = extraInfoAttribute.templateId.getOrElse(""),
        designId = extraInfoAttribute.designId.getOrElse(""),
        referenceId = extraInfoAttribute.referenceId.getOrElse(""),
        provinceId = provinceId,
        cityId = cityId,
        districtId = districtId,
        neighborName = neighborName,
        roomNumbers = roomNumbers,
        roomStyleCode = roomStyleCode,
        isPublic = extraInfoAttribute.isPublic,
        area = area,
        grossArea = grossArea,
        acsAssetId = extraInfoAttribute.acs_asset_id.getOrElse(""),
        acsProjectId = extraInfoAttribute.acs_project_id.getOrElse(""),
        auditStatus = auditStatus,
        auditorId = auditorId,
        submitTime = submitTime,
        auditTime = auditTime,
        rejectCount = rejectCount
      ))
    } else {
      None
    }
  }
private def parseTemplateName(asset: Asset): String = {
	val attribute = asset.attributes.head
	val freeObj = Json.parse(attribute.free.head).asInstanceOf[JsObject]
	val province = municipalityFilter((freeObj \ "province" \ "name").asOpt[String].getOrElse(""), "省")
	val city = municipalityFilter((freeObj \ "city" \ "name").asOpt[String].getOrElse(""), "市")
	val district = municipalityFilter((freeObj \ "district" \ "name").asOpt[String].getOrElse(""), "区")
	val neighbor = municipalityFilter((freeObj \ "neighbor").asOpt[String].getOrElse(""), "")
	val bedroomNum = municipalityFilter((freeObj \ "bedroomNum").asOpt[String].getOrElse(""), "室")
	val livingroomNum = municipalityFilter((freeObj \ "livingroomNum").asOpt[String].getOrElse(""), "厅")
	val bathroomNum = municipalityFilter((freeObj \ "bathroomNum").asOpt[String].getOrElse(""), "卫")
	val grossArea = municipalityFilter((freeObj \ "grossArea").asOpt[Long].getOrElse(0).toString, "m2")
	
	province + city + district + " " + neighbor + bedroomNum + livingroomNum + bathroomNum + " " + grossArea
}
	
private def municipalityFilter(name: String, concatWord: String): String = {
	if(name.isEmpty)
	""
	else if("省".equals(concatWord) && (name.contains("北京") || name.contains("上海") || name.contains("重庆") || name.contains("天津")))
	""
	else if(name.endsWith("市")||name.endsWith("区"))
	name
	else  name + concatWord
}
private def parseTemplateName(asset: Asset): String = {
	val attribute = asset.attributes.head
	val freeObj = Json.parse(attribute.free.head).asInstanceOf[JsObject]
	val province = municipalityFilter((freeObj \ "province" \ "name").asOpt[String].getOrElse(""), "ʡ")
	val city = municipalityFilter((freeObj \ "city" \ "name").asOpt[String].getOrElse(""), "��")
	val district = municipalityFilter((freeObj \ "district" \ "name").asOpt[String].getOrElse(""), "��")
	val neighbor = municipalityFilter((freeObj \ "neighbor").asOpt[String].getOrElse(""), "")
	val bedroomNum = municipalityFilter((freeObj \ "bedroomNum").asOpt[String].getOrElse(""), "��")
	val livingroomNum = municipalityFilter((freeObj \ "livingroomNum").asOpt[String].getOrElse(""), "��")
	val bathroomNum = municipalityFilter((freeObj \ "bathroomNum").asOpt[String].getOrElse(""), "��")
	val grossArea = municipalityFilter((freeObj \ "grossArea").asOpt[Long].getOrElse(0).toString, "m2")
	
	province + city + district + " " + neighbor + bedroomNum + livingroomNum + bathroomNum + " " + grossArea
}
	
private def municipalityFilter(name: String, concatWord: String): String = {
	if(name.isEmpty)
	""
	else if("ʡ".equals(concatWord) && (name.contains("����") || name.contains("�Ϻ�") || name.contains("����") || name.contains("���")))
	""
	else if(name.endsWith("��")||name.endsWith("��"))
	name
	else  name + concatWord
}
# -*- coding:UTF-8 -*-
import time
import json
import urllib2
import csv
# import unicodecsv
from datetime import datetime
from couchbase.bucket import Bucket

# conn_src  = Bucket('couchbase://179:8091/catalogue') # uat couchbase
conn_src  = Bucket('couchbase://.207:8091/catalogue') # aliyun prod couchbase
#contentType/customized
customizedList = [
    "aa250bfb-c62e-4ad8-8880-079bdecdb290",
    "9ed347ec-c31f-4bb5-a756-819dd71b4bd8",
    "3e03c836-f1a6-4ddc-9f39-8a083f97b2eb",
    "ac5b63d1-ef32-47e9-b615-ffa54991e9f2",
    "f041a5af-a78f-415e-934a-777d7950f5b6",
    "252fc2d9-9a3f-4cc0-9032-56857f33c77f",
    "ddbc480f-6761-446f-a396-3937a8baa34f",
    "ddbc480f-6761-446f-a396-3937a8baa34f",
    "7eba035d-b57c-4177-a884-ff48cf2f2c6c",
    "6d4556b4-a03e-46c3-98cb-f4822e076ae7"
]
def getTime():
    return str(int(time.time()))

resultList = list()

def getData(key):
    data = None
    try:
        data = conn_src.get(key)
    except Exception as e:
        # print 'WARNING: Not found ' + key
        try:
            data = conn_src.get(key, replica=True)
        except Exception as e:
            print 'WARNING: Not found ' + key + ">>" + str(e)
            return None
    return data.value


#return first element of array
def firstEntry(someArr):
    arrLen = len(someArr)
    if arrLen== 0:
        return ""
    else:
        return someArr[0]
#return first element of array
def firstEntryCate(someArr):
    arrLen = len(someArr)
    if arrLen== 0:
        return ""
    else:
        return someArr[0]
        # if any(someArr[0] == s for s in categoryIdsList):
        # return someArr[0]
        # else:
        # return "default-NotCategory"

#return (flag, contentType, style)
#contentType.id = "dbd9b78c-fbae-4931-ac30-ff218059b3c6"
#style.id = "9221463d-18ca-4b63-b09b-a2000585a00b"
def parseAttr(someArr):
    contentType = ""
    style = ""
    for ele in someArr:
        if ele.get("typeId","") == "attr-isVariation":
            isVariation = firstEntry(ele.get("values",[]))
            if isVariation <> "attr-isVariation-false":
                return ("invalid", "", "")
        if ele.get("typeId","") == "dbd9b78c-fbae-4931-ac30-ff218059b3c6":
            contentType = firstEntry(ele.get("values",[]))
            if any(contentType == s for s in customizedList):
                return ("invalid", "", "")
        if ele.get("typeId","") == "9221463d-18ca-4b63-b09b-a2000585a00b":
            style = firstEntry(ele.get("values",[]))
    return ("valid", contentType, style)

def parseFiles(someArr):
    #resultList.append(str(len(someArr)))
    fileUrl = "default"
    for ele in someArr:
        if ele.get("metaData","") == "iso":
            fileUrl = ele.get("url","default--")
            return fileUrl
    return fileUrl

def removeIllegalCharacter(pre):
    after = " ".join(pre.replace("\"", " ")
                     .replace("'", " ")
                     .replace(",", " ")
                     .split())
    return after

def process():
    with open("logs\pduct"+getTime()+".csv", "wb") as f:
        csvwriter = csv.writer(f)
        csvwriter.writerow(['product_id', 'defaultName', 'defaultDescription', 'brandId', 'categoryId', 'contentType', 'style', 'creationTime', 'fileUrl'])

        # with open("selectedProductIds.txt", 'r') as load_f:
        with open("productIds.txt", 'r') as load_f:
            for line in load_f:
                pid = line.strip()
                try:
                    product = getData(pid)
                    if product is None:
                        resultList.append("gggggetFailed=="+pid)
                        continue
                    attributes = product.get("attributes",[])
                    (flag, contentType, style) = parseAttr(attributes)
                    if flag != "valid":
                        continue

                    files = product.get("files",[])
                    fileUrl = parseFiles(files)

                    product_id = product.get("id", "")
                    defaultName = product.get("defaultName", "defaultName")
                    defaultDescription = product.get("defaultDescription", "")
                    if not defaultDescription.strip():
                        defaultDescription = defaultName
                        if not defaultDescription.strip():
                            defaultDescription = "defaultDescription"

                    defaultName = removeIllegalCharacter(defaultName)
                    defaultDescription = removeIllegalCharacter(defaultDescription)

                    brandsIds = product.get("brandsIds", [])
                    categories = product.get("tenantProducts", {}).get("ezhome", {}).get("categories", [])
                    brandId = firstEntry(brandsIds)
                    categoryId = firstEntryCate(categories)

                    creationTimePre = product.get("creationTime", "2017-11-30T17:01:45.701Z")
                    creationTime = datetime.strptime(creationTimePre, "%Y-%m-%dT%H:%M:%S.%fZ").strftime('%Y-%m-%d %H:%M:%S')
                    if product_id != "":
                        csvwriter.writerow((product_id.encode("utf-8"),
                                            defaultName.encode("utf-8"),
                                            defaultDescription.encode("utf-8"),
                                            brandId.encode("utf-8"),
                                            categoryId.encode("utf-8"),
                                            contentType.encode("utf-8"),
                                            style.encode("utf-8"),
                                            creationTime.encode("utf-8"),
                                            fileUrl.encode("utf-8")))
                except Exception as e:
                    print e
                    resultList.append(pid + "====errMessage:" + str(e))
                finally:
                    print pid
                    resultList.append(pid)

    if len(resultList) > 0:
        with open("logs\logProduct"+getTime()+".txt", "w") as f:
            lines = "\n".join(resultList)
            f.write(lines)

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("--ids", action="store", type="string", dest="ids")
    (options, args) = parser.parse_args()

    # if not options.ids:
    # print "Usage: python ./cbToCsv.py --ids ./path/to/file/list"
    # exit(1)

    process()


# -*- coding:UTF-8 -*-
import time
import json
from couchbase.bucket import Bucket

conn_src  = Bucket('couchbase://47.94.135.179:8091/user') # uat

resultList = list()

def getData(key):
    data = None
    try:
        print "Reading: " + key
        data = conn_src.get(key)
    except Exception as e:
        try:
            data = conn_src.get(key, replica=True)
            # print 'Found in replica ' + key
        except Exception as e:
            print 'WARNING: Not found ' + key + ">>" + str(e)
            resultList.append("getFailed=="+key)
            return None
    return data.value

def setData(key, data, change):
    try:
        print "Writing: " + key
        conn_src.set(key, data)
        resultList.append(change + " Succeed=="+key)
    except Exception as e:
        print 'Writeing failed' + key
        resultList.append(change + " Failed=="+key)

def ifNvlThenCreateKey(productData, key, defaultValue):
    try:
        if productData[key] is None:
            productData[key]=defaultValue
    except Exception as e:
        productData[key]=defaultValue
        print "attribute " +key+ " null exception! CREATE!"
    finally:
        return productData

def process(filePath):
    productIds = loadProductIds(filePath)

    for productId in productIds:
        userJson = json.loads(productId)
        userId = userJson["guid"].strip()
        company = userJson["company"].strip()
        change = userJson["change"].strip()
        #print userJson["guid"] + "==" + userJson["company"]
        productData = getData(userId)
        #if productData and productData.has_key("groupids"):
        if productData:
            productData = ifNvlThenCreateKey(productData, "groupids", [])
            groups = productData["groupids"]
            
            realChange = 0
            try:
                idx = groups.index(company)
                if change=="delete":
                    groups.pop(idx)
                    realChange = 1
            except ValueError:
                if change=="add":
                    groups.append(company)
                    realChange = 1
            if realChange == 1:
                productData["groupids"] = groups
                setData(userId, productData, change)
    if len(resultList) > 0:
        with open("logs\drawCoLog"+str(int(time.time()))+".txt", "w") as f:
            lines = "\n".join(resultList)
            f.write(lines)

def loadProductIds(filePath):
    fo = open(filePath, "r")
    lines = fo.readlines()
    fo.close()

    ids = []
    for line in lines:
        cid = line.replace("\n", "").strip()
        if cid:
            ids.append(cid)
    return ids

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("--ids", action="store", type="string", dest="ids")
    (options, args) = parser.parse_args()

    if not options.ids:
        print "Usage: python ./patchDrawCo.py --ids ./path/to/id/list"
        exit(1)

    process(options.ids)


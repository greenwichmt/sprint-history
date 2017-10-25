# -*- coding:UTF-8 -*-
import time
import json
from couchbase.bucket import Bucket

#conn_src  = Bucket('couchbase://47.94.135.179:8091/user') # uat
conn_src  = Bucket('couchbase://54.222.137.30:8091/user') # prod

# audit_group = 'group-role-auditor_ezhome'

def getData(key, resultSet):
    data = None
    try:
        print "Reading: " + key
        data = conn_src.get(key)
    except Exception as e:
        # print 'WARNING: Not found ' + key
        try:
            data = conn_src.get(key, replica=True)
            print 'Found in replica ' + key
        except Exception as e:
            print 'WARNING: Not found ' + key + ">>" + str(e)
            resultSet.add("getFailed=="+key)
            return None
    return data.value

def setData(key, data, resultSet):
    try:
        print "Writing: " + key
        conn_src.set(key, data)
        resultSet.add("setSucceed=="+key)
    except Exception as e:
        print 'Writeing failed' + key
        resultSet.add("setFailed=="+key)

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

    resultSet = set()
    for productId in productIds:
        userJson = json.loads(productId)
        userId = userJson["guid"].strip()
        company = userJson["company"].strip()
        #print userJson["guid"] + "==" + userJson["company"]
        productData = getData(userId, resultSet)
        #if productData and productData.has_key("groupids"):
        if productData:
            productData = ifNvlThenCreateKey(productData, "groupids", [])
            groups = productData["groupids"]
            try:
                groups.index(company)
            except ValueError:
                groups.append(company)
                productData["groupids"] = groups
            setData(userId, productData, resultSet)
    if len(resultSet) > 0:
        with open("logs\drawCoLog"+str(int(time.time()))+".txt", "w") as f:
            lines = "\n".join(list(resultSet))
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


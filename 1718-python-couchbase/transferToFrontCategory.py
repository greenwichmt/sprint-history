# -*- coding:UTF-8 -*-
import json
import copy
import uuid
import os
import urlparse
import urllib2
import shutil
import boto3
import time
from couchbase.bucket import Bucket
#mys3 = boto3.resource('s3')
#s3 = boto3.resource('s3', region_name = "cn-north-1")
conn_src  = Bucket('couchbase://47.94.135.179:8091/catalogue') # uat couchbase
#global_src  = Bucket('couchbase://47.89.179.118:8091/catalogue') # prod couchbase
#local_src  = Bucket('couchbase://localhost:8091/catalogue')

def getData(key):
    data = None
    try:
        data = conn_src.get(key)
    except Exception as e:
        print "Not exists " + key
        return None
    #data = conn_src.get(key)
    return data.value

def insertData(key, data):
    conn_src.insert(key, data) 

def updateData(key, data):
    conn_src.set(key, data)

def ifNvlThenCreateKey(productData, key, defaultValue):
    try:
        productData[key]
    except Exception as e:
        productData[key]=defaultValue
        print "attribute " +key+ " null exception! CREATE!"
    return productData

def appendAttr(productData, typeId, jsonData):
    attrIdx = []
    for idx in range(len(productData["attributes"])):
        if productData["attributes"][idx]["typeId"]==typeId:
            attrIdx.append(idx)
            print "!" + typeId + " exists,stack it for delete!"
    for idx in attrIdx:
        del productData["attributes"][idx]
    productData["attributes"].append(jsonData)
    return productData

#attr-category-mappings
#attr-category-root
#prod-hsm-assets.s3.amazonaws.com
def mergeNewData(productData, oldId):
    jsonCateRoot = json.loads("{\"typeId\":\"attr-category-root\",\"values\":[],\"free\":[\"front-category-root\"]}")
    jsonMappings = json.loads("{\"typeId\":\"attr-category-mappings\",\"values\":[],\"free\":[\""+oldId+"\"]}")
    ifNvlThenCreateKey(productData, "attributes", [])
    ifNvlThenCreateKey(productData, "children", [])

    appendAttr(productData, "attr-category-root", jsonCateRoot)
    if len(productData["children"])==0:
        appendAttr(productData, "attr-category-mappings", jsonMappings)
    return productData

def updateDoc(newId, oldId, logSuffix):
    productData = getData(newId)
    # if newId=="a92d8447-68b4-4282-9e07-1bc49a8d3d0d":
        # print "OOOOnly process a92d8447-68b4-4282-9e07-1bc49a8d3d0d"
    if productData<>None:
        newData = mergeNewData(productData, oldId)
        
        with open("logs\patchLog"+logSuffix+".txt", "a") as logFile:
            print "processing..." + newId
            try:
                updateData(newId, newData)
                logFile.write("succeed--" + newId)
            except Exception as e:
                print str(e)
                logFile.write("failed--" + newId + "--" + e)
            logFile.write("\n")

#recursion
def doProcess(curNode, logSuffix):
    oldId = curNode["id"]
    if oldId=="backend-category-root":
        newId = "front-category-root"
    else:
        a = str(format(int('0x'+oldId.replace("-",""),16) + 1,'0x'))
        newId = a[:8]+"-"+ a[8:12]+"-"+ a[12:16]+"-"+ a[16:20]+"-"+ a[20:]
    updateDoc(newId, oldId, logSuffix)
    for childNode in curNode["children"]:
        doProcess(childNode, logSuffix)

#pre-Process
def process(rootid):
    rootNode = getData(rootid)
    logSuffix = str(int(time.time()))
    print rootNode["id"]
    print "----------Begin process root doc-------------"
    doProcess(rootNode, logSuffix)

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("--ids", action="store", type="string", dest="ids")
    (options, args) = parser.parse_args()

    if not options.ids:
        print "Usage: python ./XXXXXXXX.py --ids=Null"
        exit(1)

    process(options.ids)


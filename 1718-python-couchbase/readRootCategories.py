# -*- coding:UTF-8 -*-
import json
import copy
import uuid
import os
import urlparse
import urllib2
import shutil
import boto3
from couchbase.bucket import Bucket
#mys3 = boto3.resource('s3')
#s3 = boto3.resource('s3', region_name = "cn-north-1")
conn_src  = Bucket('couchbase://47.94.135.179:8091/catalogue') # uat couchbase
#global_src  = Bucket('couchbase://47.89.179.118:8091/catalogue') # global couchbase
#local_src  = Bucket('couchbase://localhost:8091/catalogue')

def getData(key):
    data = None
    # try:
        # data = conn_src.get(key)
    # except Exception as e:
        # data = None
    data = conn_src.get(key)
    return data.value

def insertData(key, data):
    conn_src.insert(key, data) 

def updateData(key, data):
    conn_src.set(key, data)
#attr-category-mappings
#prod-hsm-assets.s3.amazonaws.com
def mergeNewData(productData, parentId, childList):
    jsonData = json.loads("{\"typeId\":\"attr-category-root\",\"values\":[],\"free\":[\"backend-category-root\"]}")
    try:
        productData["attributes"]
    except Exception as e:
        productData["attributes"]=[]
        print "attribute null exception! CREATE!"


    attrFlag = 0
    for attr in productData["attributes"]:
        if attr["typeId"]=="attr-category-root":
            attrFlag = 1
            print "attr-category-root already exists!"
    if attrFlag==0:
        productData["attributes"].append(jsonData)
    productData["parentId"] = parentId
    productData["children"] = childList
    return productData

def updateDoc(docId, parentId, childList):
    productData = getData(docId)
    # if docId=="64af06f4-ab05-4eda-ab25-ece956bf098b":
        # print "OOOOnly process 64af06f4-ab05-4eda-ab25-ece956bf098b"
    newData = mergeNewData(productData, parentId, childList)
    
    with open("patchLog.txt", "a") as logFile:
        print "processing..." + docId
        try:
            updateData(docId, newData)
            logFile.write("succeed--" + docId)
        except Exception as e:
            print str(e)
            logFile.write("failed--" + docId + "--" + e)
        logFile.write("\n")

#recursion
def doProcess(parentId, curId, childrenArray):
    childList = []
    for childNode in childrenArray:
        childList.append(childNode["id"])
    updateDoc(curId, parentId, childList)
    for childNode in childrenArray:
        doProcess(curId, childNode["id"], childNode["children"])

#pre-Process
def process(rootid):
    rootNode = getData(rootid)
    print rootNode["id"]
    print "----------Begin process root doc-------------"
    doProcess("", rootNode["id"], rootNode["children"])

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("--ids", action="store", type="string", dest="ids")
    (options, args) = parser.parse_args()

    if not options.ids:
        print "Usage: python ./XXXXXXXX.py --ids=Null"
        exit(1)

    process(options.ids)


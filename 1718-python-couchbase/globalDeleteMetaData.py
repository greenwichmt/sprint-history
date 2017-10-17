# -*- coding:UTF-8 -*-
import json
import os
import urlparse
import urllib2
import shutil
import time
from couchbase.bucket import Bucket

global_src  = Bucket('couchbase://47.89.179.118:8091/catalogue') # global couchbase

def getData(key):
    data = None
    try:
        data = global_src.get(key)
    except Exception as e:
        print "Not exists " + key
        return None
    #data = conn_src.get(key)
    return data.value

def updateData(key, data):
    global_src.set(key, data)

def ifNvlThenCreateKey(productData, key, defaultValue):
    try:
        productData[key]
    except Exception as e:
        productData[key]=defaultValue
        print "attribute " +key+ " null exception! CREATE!"
    finally:
        return productData

def keyNotExists(checkData, key):
    try:
        checkData[key]
        return False
    except Exception:
        return True

#attr-category-mappings
#prod-hsm-assets.s3.amazonaws.com
def deleteInfoFromFiles(productData):
    productData = ifNvlThenCreateKey(productData, "files", [])
    attrIdx = []
    for idx in range(len(productData["files"])):
        if keyNotExists(productData["files"][idx],"metaData"):
            attrIdx.append(idx)
            print "metaData not exists,stack it for delete!idx="+str(idx)
    attrIdx.sort(reverse=True)
    for idx in attrIdx:
        del productData["files"][idx]
    return productData

def doProcess(line, logSuffix):
    productId = line
    productData = getData(productId)

    if productData is not None:
        newData = deleteInfoFromFiles(productData)
        updateData(productId,newData)
        print "update OK--" + productId + "--"


#pre-Process #recursion
def process(filePath):
    items = loadProductIds(filePath)
    logSuffix = str(int(time.time()))

    with open("logs\uploadMetaDataLog"+logSuffix+".txt", "a") as err:
        for line in items:
            try:
                doProcess(line, logSuffix)
                err.write("Processed--" + line)
            except Exception as e:
                print str(e) + line
                err.write("Halted--" + line + str(e))
            finally:
                err.write("\n")

def loadProductIds(filePath):
    fo = open(filePath, "r")
    lines = fo.readlines()
    fo.close()
    return lines

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("--ids", action="store", type="string", dest="ids")
    (options, args) = parser.parse_args()

    if not options.ids:
        print "Usage: python ./XXXXXXXX.py --ids ./path/to/id/list"
        exit(1)

    process(options.ids)


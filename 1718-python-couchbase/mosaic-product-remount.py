# -*- coding:UTF-8 -*-
import requests
import time
import json
from couchbase.bucket import Bucket

conn_src  = Bucket('couchbase://47.94.135.179:8091/catalogue') # uat
#conn_src  = Bucket('couchbase://54.222.137.30:8091/catalogue') # prod

#mosaic_categoryId = '43c49d7a-e310-4572-b6c0-415d3c2371ab'
#/mosaic-ceramic/mosaic-glass/   contentType map to category
content_type_map = {
    "74112bbf-6a31-4fe0-9a23-f53757bf69cb":"659aa4d5-5326-4d50-86d6-e033df9f0ec4",
    "f6a7d6e5-6b6e-41d6-a56e-54b02c37cbe1":"4f99c844-b51c-4f8b-b16c-d0d15b0e7f16"
}
catalog_map_name = {
    "659aa4d5-5326-4d50-86d6-e033df9f0ec4":"mosaic-ceramic",
    "4f99c844-b51c-4f8b-b16c-d0d15b0e7f16":"mosaic-glass"
}

resultList = list()

def getData(key):
    data = None
    try:
        print "Reading: " + key
        data = conn_src.get(key)
    except Exception as e:
        try:
            data = conn_src.get(key, replica=True)
            print 'Found in replica ' + key
        except Exception as e:
            print 'WARNING: Not found ' + key + ">>" + str(e)
            resultList.append("getFailed=="+key)
            return None
    return data.value

def setData(key, data):
    try:
        print "Writing: " + key
        conn_src.set(key, data)
    except Exception as e:
        print 'Writeing failed' + key


#get products by categoryId
def getProductsByCategoryId(categoryId):
    query = "http://ec2-54-222-137-30.cn-north-1.compute.amazonaws.com.cn:8092/catalogue/_design/products/_view/by_category?inclusive_end=true&key=%5B%22ezhome%22%2C%22{0}%22%5D&stale=false&connection_timeout=60000&limit=200&skip=0".format(categoryId)
    r = requests.get(query)
    json_loads = json.loads(r.content)
    cb_products = json_loads['rows']
    product_count = len(cb_products)
    if product_count>1:
        print categoryId + '--this categoryId has ' + str(product_count) + ' PRODUCTS'
    else:
        print categoryId + '--this categoryId has no products'
    return cb_products

def getMosaicCode(productData):
    mosaic_code = "nil"
    for attr in productData["attributes"]:
        if attr["typeId"]=="dbd9b78c-fbae-4931-ac30-ff218059b3c6":
            for val in attr["values"]:
                try:
                    mosaic_code = content_type_map[val]
                    resultList.append("id="+productData["id"]+",mosaic_code="+ catalog_map_name[mosaic_code] )
                except Exception as e:
                    pass
    return mosaic_code

def changeMosaicToSub(productData, mosaic_categoryId):
    categories = productData["tenantProducts"]["ezhome"]["categories"]
    idx = -1
    try:
        idx = categories.index(mosaic_categoryId)
    except ValueError:
        pass
    if idx > -1 :
        mosaic_code = getMosaicCode(productData)
        if mosaic_code <> "nil":
            categories[idx] = mosaic_code
            productData["tenantProducts"]["ezhome"]["categories"] = categories
            return "changed"
    return "notChanged"

def process(mosaic_categoryId):
    products = getProductsByCategoryId(mosaic_categoryId)

    for productRow in products:
        productData = productRow["value"]
        productId = productData["id"]
        # if productId=="3b0cb77f-b7f0-4430-aedb-9408a3b130ae":
            # print "if productId=="
        try:
            returnStr = changeMosaicToSub(productData, mosaic_categoryId)
            #print "changeMosaicToSub=="
            if returnStr=="changed":
                setData(productId, productData)
                resultList.append("RRRRRRRRRealChanged=="+productId)
            else:
                resultList.append("NNNNNNNNNNotChanged=="+productId)
        except Exception as e:
            resultList.append("changeMosaicToSubFailed=="+productId)
    if len(resultList) > 0:
        with open("logs\mosaicRemountLog"+str(int(time.time()))+".txt", "w") as f:
            lines = "\n".join(resultList)
            f.write(lines)

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("--ids", action="store", type="string", dest="ids")
    (options, args) = parser.parse_args()

    if not options.ids:
        print "Usage: python mosaic-product-remount.py --ids=43c49d7a-e310-4572-b6c0-415d3c2371ab"
        exit(1)

    process(options.ids.strip())


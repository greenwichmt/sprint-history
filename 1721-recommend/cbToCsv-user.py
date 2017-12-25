# -*- coding:UTF-8 -*-
import time
import json
import urllib2
import csv
import codecs
import types
from datetime import datetime

resultList = list()
def getTime():
    return str(int(time.time()))

#query user info by couchbase SQL api
def queryUserData(page, limit):
    #%2Cgroupids
    queryUrl = "http://couchbase_host:8093/query/service?statement=select+id%2C%60profile%60.city%2Cutype%2Ccreated+from+%60user%60+where+docType%3D%22user%22+offset+{}+limit+{}".format((page-1)*limit,limit)
    req = urllib2.Request(queryUrl)
    data = urllib2.urlopen(req).read()
    jsonValue = json.loads(data)
    results_arr = jsonValue['results']
    # if len(results_arr)>1:
        # print 'Get ok'
    return results_arr

def process():
    page = 39
    limit = 1000
    with open("logs\user"+getTime()+".csv", "wb") as csvfile:
        csvwriter = csv.writer(csvfile)
        csvwriter.writerow(['user_id', 'city', 'utype', 'created'])
        while page==39:
            # if page <> 39:
            #     break
            try:
                results_arr = queryUserData(page, limit)
                if len(results_arr) == 0:
                    break
                for user in results_arr:
                    user_id = user.get("id","")
                    city = user.get("city","")
                    if len(city) <> 6:
                        city = None
                    utype = user.get("utype","designer")
                    createdLong = user.get("created",time.time()*1000L)
                    created = datetime.fromtimestamp(createdLong/1000L).strftime('%Y-%m-%d %H:%M:%S')
                    #groupids = user.get("groupids","")
                    if user_id != "":
                        csvwriter.writerow((user_id, city, utype, created))
                resultList.append("curPage" + str(page))
                if page%10==0:
                    print page
            except Exception as e:
                print e
                resultList.append("curPage" + str(page) + str(e))
            finally:
                page += 1
    if len(resultList) > 0:
        with open("logs\cbToCsvLog"+getTime()+".txt", "w") as f:
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


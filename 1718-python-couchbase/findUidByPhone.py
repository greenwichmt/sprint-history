# -*- coding:UTF-8 -*-

import requests
import time
import json
from couchbase.bucket import Bucket

#conn_src  = Bucket('couchbase://localhost/user') # Users

audit_group = 'group-role-auditor_ezhome'

#find uid by phone num
def findUid(num):
    query = "http://ec2-54-222-137-30.cn-north-1.compute.amazonaws.com.cn:8092/user/_design/user/_view/by_phone?inclusive_end=true&amp;key=%22{}%22".format(num)
    r = requests.get(query)
    json_str = json.loads(r.content)
    l = len(json_str['rows'])
    if l>1:
        print num + ' has more than one uid'
    id = ''
    try:  
        id = json_str['rows'][0]['id']
    except:
        pass
    return id

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

def process(filePath):
    userPhones = loadProductIds(filePath)

    resultSet = set()
    for userPhone in userPhones:
        resultSet.add(userPhone + "=" + findUid(userPhone))

    if len(resultSet) > 0:
        with open("resultLog"+str(int(time.time()))+".txt", "w") as f:
            lines = "\n".join(list(resultSet))
            f.write(lines)

if __name__ == '__main__':
    from optparse import OptionParser
    parser = OptionParser()
    parser.add_option("--ids", action="store", type="string", dest="ids")
    (options, args) = parser.parse_args()

    if not options.ids:
        print "Usage: python ./findUidByPhone.py --ids DRAWER.txt"
        exit(1)

    process(options.ids)


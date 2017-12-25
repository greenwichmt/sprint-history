# -*- coding:UTF-8 -*-
# Import smtplib for the actual sending function
import smtplib
import time
# Here are the email package modules we'll need
import email
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import MySQLdb
import re
EMAIL_REGEX = re.compile(r"^[^@]+@[^@-]+\.(com|org|edu|net)$")

_SERVER = "email-smtp.us-east-1.amazonaws.com"
_PORT = 25
_ACCOUNT = "xxxx"
_PASSWORD = "xxxxxxxx"

_FROM = "Homestyler<support@homestyler.com>"
id_email_tuple = ["aptignite@yeah.net","shumaosong@juran.com.cn","aptignite@gmail.com"]
del id_email_tuple[:]

#SQL data access part
#db = MySQLdb.connect(host='localhost', user='root', passwd='123456', db='testsms')
db = MySQLdb.connect(host='rm-0xipqs0fkm077zod2o.mysql.rds.aliyuncs.com', user='hsmroot', passwd='xxxxx', db='hsmdb')
cursor = db.cursor()
cursor.execute('SELECT "mason","aptignite@yeah.net",10 FROM dual')###################
#cursor.execute('SELECT UserAdaID,UserEmail,id FROM usersendemail where id between 13 and 400000')
#cursor.execute('SELECT UserAdaID,UserEmail,id FROM usersendemail where id = 0')
rows = cursor.fetchall()
print "All data readed from mysql."

server = smtplib.SMTP()
def emailServiceConnect():
    server.connect(_SERVER, _PORT) # for eg. host = 'smtp.gmail.com', port = 587
    server.ehlo()
    server.starttls()
    server.login(_ACCOUNT, _PASSWORD)

def send_mail():
    
    fromaddr = _FROM
    for id_email_tuple in rows:
        try:
            _TO = id_email_tuple[1]
            if "autodesk" in _TO or "backup" in _TO:
                continue
            if not EMAIL_REGEX.match(_TO):
                continue
            msg = MIMEMultipart()
            msg['From'] = fromaddr
            msg['To'] = _TO
            msg['Subject'] = 'Merry Christmas and Happy New Year!'
            
            #msg.attach(MIMEText('Just wanted to say hi' + str(int(time.time())), 'plain'))
            bigHtmlReplaced = bigHtml.replace("ADAIDPLACEHOLDER",id_email_tuple[0]).replace("EMAILPLACEHOLDER",id_email_tuple[1])
            msg.attach(MIMEText(bigHtmlReplaced, 'html'))
            try:
                server.sendmail(fromaddr, _TO, msg.as_string())
            except Exception as e:
                emailServiceConnect()
                server.sendmail(fromaddr, _TO, msg.as_string())
            print "Succeed: " + _TO
            cursor.execute('update usersendemail8 set respTime=sysdate(),respMsg="ok" where id={}'.format(id_email_tuple[2]) )
            if id_email_tuple[2]%100==0:
                db.commit()
                print "--8commit when id="+str(id_email_tuple[2])
        except Exception as e:
            print "Failed: " + _TO + ";errmsg: " + str(e)
            cursor.execute('update usersendemail8 set respTime=sysdate(),respMsg="Error: ' + str(e) + '" where id={}'.format(id_email_tuple[2]) )
            break
    db.commit()
    server.quit()

bigHtml = """\
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Unsubscribe</title>
</head>
<body marginheight="0" topmargin="0" marginwidth="0" bgcolor="#F2F2F2" offset="0" leftmargin="0"
      style="background-color: #f2f2f2;">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Unsubscribe</title>
<style type="text/css">
    /*<![CDATA[*/
    #outlook a {
        padding: 0;
    }

    /* Prevent WebKit and Windows mobile changing default text sizes */
    body,
    table,
    td,
    p,
    a,
    li,
    blockquote {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
    }

    /* Remove spacing between tables in Outlook 2007 and up */
    table,
    td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
    }

    /* Allow smoother rendering of resized image in Internet Explorer */
    img {
        -ms-interpolation-mode: bicubic;
    }

    /*=Reset */
    body {
        margin: 0;
        padding: 0;
        background-color: #f2f2f2 !important;
    }

    img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
    }

    table {
        border-collapse: collapse !important
    }

    body,
    #bodyTable,
    #bodyCell {
        height: 100% !important;
        margin: 0;
        padding: 0;
        width: 100% !important;
    }

    .postFooterContent a:visited {
        color: #999999 !important;
        font-weight: normal !important;
        text-decoration: underline !important;
    }
    #templateBodyCornersTop {
        -webkit-border-top-left-radius: 10px !important;
        -moz-border-top-left-radius: 10px !important;
        -ms-border-top-left-radius: 10px !important;
        -o-border-top-left-radius: 10px !important;
        border-top-left-radius: 10px !important;
        -webkit-border-top-right-radius: 10px !important;
        -moz-border-top-right-radius: 10px !important;
        -ms-border-top-right-radius: 10px !important;
        -o-border-top-right-radius: 10px !important;
        background-color: #ffffff !important;
        border-top-right-radius: 10px !important;
        table-layout: auto !important;
        overflow: hidden !important;
    }
    #templateFooter {
        -webkit-border-bottom-left-radius: 10px !important;
        -moz-border-bottom-left-radius: 10px !important;
        -ms-border-bottom-left-radius: 10px !important;
        -o-border-bottom-left-radius: 10px !important;
        border-bottom-left-radius: 10px !important;
        -webkit-border-bottom-right-radius: 10px !important;
        -moz-border-bottom-right-radius: 10px !important;
        -ms-border-bottom-right-radius: 10px !important;
        -o-border-bottom-right-radius: 10px !important;
        border-bottom-right-radius: 10px !important;
        overflow: hidden !important;
        table-layout: auto !important;
    }
    /*=Responsive
   --------------------------------------------------------------------------------------- */
    @media only screen and (max-width: 600px) {
        /* responsive - client override */
        /* Prevent Webkit platforms from changing default text sizes */
        body,
        table,
        td,
        p,
        a,
        li,
        blockquote {
            -webkit-text-size-adjust: none !important
        }

        /* Prevent iOS Mail from adding padding to the body */
        body {
            width: 100% !important;
            min-width: 100% !important;
        }

        /* responsive - reset */
        #bodyCell {
            padding: 10px !important;
        }

        /* responsive - general */
        #templateContainer {
            max-width: 600px !important;
            width: 100% !important;
        }
        #templateBodyCornersTop,
        .bodyContentCornerTop{
            table-layout: auto !important;
            height:auto !important;
        }
        .bodyContentCornerTop img{
            max-width: 600px !important;
            width: 100% !important;
            height:auto !important;
        }

        .bodyContent{
            padding-left:20px !important;
            padding-right:20px !important;
        }
        /* responsive - available platforms */
        #threeLinksDetails{
            table-layout: auto !important;
            width: auto !important;
        }

        .threeLinksContent {
            width: 90px !important
        }

        .threeLinksContent img {
            height: auto !important;
            width: 90px !important;
        }

        .threeLinksContentSpacer {
            width:5px !important;
        }
    }

    /*]]>*/
</style>
<!-- body cell begin -->
<center>
    <table cellspacing="0" id="bodyTable" border="0" height="100%" align="center" bgcolor="#F2F2F2" width="98%"
           cellpadding="0" style="background-color: #f2f2f2;">
        <tbody>
        <tr>
            <td id="bodyCell" align="center" valign="top" style="padding-top: 10px; padding-bottom: 10px;">
                <table cellspacing="0" id="templateContainer" border="0" cellpadding="0" style="width: 600px;">
                    <tbody>

                    <!-- if preheader -->
                    <tr>
                        <td align="center" valign="top">
                            <table id="templatePreheader" border="0" bgcolor="#F2F2F2" width="100%"
                                   cellpadding="0" cellspacing="0" style="background-color: #f2f2f2;">
                                <tbody>
                                <tr>
                                    <td class="preheaderContent preheaderContentCenter" mc:edit="preheader_content00"
                                        align="center" valign="top"
                                        style="padding-top: 0px; padding-bottom: 4px;; text-align: center;">
                                        <div>
                                            <a href="https://www.homestyler.com" target="_blank"><img alt="homestyler" border="0"
                                                 src="https://d2twpvqgf87n87.cloudfront.net/Images/email/homestyler2.png"
                                                 style="display: inline; width: 90px; height: 30px;"></a>
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <!-- endif preheader -->

                    <!-- body banner begin -->
                    <tr>
                        <td align="center" valign="top">
                            <table id="templateBodyCornersTop" border="0" height="230"
                                   width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF"
                                   style="line-height: 0; table-layout: fixed; background-color: #ffffff;">
                                <tbody>
                                <tr>
                                    <td class="bodyContentCornerTop" mc:edit="bodycontent_corner01"
                                        valign="top"
                                        style="font-size: 1px; line-height: 1px;">
                                        <img alt="Happy Thanksgiving"
                                             src="https://d2twpvqgf87n87.cloudfront.net/Images/email/xmas.jpg"
                                             border="0"
                                             style="height: 230px; width: 600px; display: inline;">
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <!-- body banner end -->

                    <!-- body begin -->
                    <tr>
                        <td align="center" valign="top">

                            <table id="templateBody" border="0" bgcolor="#FFFFFF"
                                   width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
                                <tbody>
                                <tr>
                                    <td class="bodyContent" mc:edit="body_content" align="left" valign="top"
                                        style="color: #505050; font-family: 'Helvetica Neue',Helvetica,arial,sans-serif; font-size: 16px; line-height: 150%; padding-right: 35px; padding-left: 35px; padding-top: 20px; padding-bottom: 10px; text-align: left;">
                                        <div style="font-family: 'Helvetica Neue',Helvetica,arial,sans-serif; font-size: 16px; line-height: 150%; color: #505050;">
                                            <div style="padding-bottom: 16px;">Dear Homestyler user, </div>
                                            <div style="padding-bottom: 16px;">Merry Christmas and Happy New Year! </div>
                                            <div style="padding-bottom: 16px;">2017 is almost over and we are so happy we had the chance to spend it with you! Homestyler would not be the same without your awesome creations, and for this reason we wish you a fabulous holiday season! May 2018 bring you all the happiness you deserve!
                                            </div>
                                            <div style="padding-bottom: 16px;">To show you how glad we are that you are part of the Homestyler family, we have prepared a small gift for you, we hope you like it!
                                            </div>
                                            <div style="padding-bottom: 16px;">The brand new Homestyler Christmas content has just arrived, in time for you to plan how to decorate your house before Santa comes visit you!
                                            </div>
                                            <div style="padding-bottom: 16px;">And in case you are still struggling with some last minute presents, don't you worry! We have got your back!
                                            </div>
                                            <div style="padding-bottom: 16px;">How does a <b>$50</b> Amazon Gift Card sounds like?
                                            </div>
                                            <div style="padding-bottom: 16px;">You can win it by creating your Christmas design and participating at our contest!
                                            </div>
                                            <div style="padding-bottom: 16px;">(read the terms and conditions on our Facebook page:
                                                <a href="https://www.facebook.com/homestyler.interiordesign/" target="_blank"  style="font-weight: normal; text-decoration: none; color: #4d9bdf !important;">https://www.facebook.com/homestyler.interiordesign/</a>)
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <!-- footer begin -->
                    <tr>
                        <td align="center" valign="top">
                            <table id="templateFooter" border="0" bgcolor="#FFFFFF"
                                   width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
                                <tbody>
                                <tr>
                                    <td class="bodyContent"
                                        valign="top"
                                        style="padding-bottom: 25px;padding-right: 35px; padding-left: 35px; text-align: left;font-family: 'Helvetica Neue',Helvetica,arial,sans-serif; font-size: 16px; line-height: 150%; color: #505050;">
                                            <div style="padding-bottom: 16px;">This is just a small way to extend our sincerest thanks for your support throughout the year, from a friend to a friend! We hope you'll appreciate it!
                                            </div>
                                            <div>All the very best,<br>The Homestyler Team</div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <!-- post footer begin -->
                    <tr>
                        <td align="center" valign="top">
                            <table id="templatePostFooter" border="0"
                                   bgcolor="#F2F2F2" width="100%" cellpadding="0" cellspacing="0"
                                   style="background-color: #f2f2f2;">
                                <tbody>
                                <tr>
                                    <td class="postFooterContent" align="center" valign="top"
                                        style="color: #999999; padding-top:15px; padding-bottom:15px; font-family: 'HelveticaNeue','HelveticaNeueLTStd',Arial,Helvetica,sans-serif; font-size: 11px; line-height: 125%; text-align: center;">
                                        If you don't want to receive messages from us,click here to <a href="https://mobileapi.homestyler.com/hsmweb/sharepage/UnsubEmail?userId=ADAIDPLACEHOLDER&userEmail=EMAILPLACEHOLDER" target="_blank" style="font-weight: normal; text-decoration: underline; color: #1960c1 !important;">unsubscribe</a>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <!-- body end -->

                    </tbody>
                </table>
            </td>
        </tr>
        </tbody>
    </table>
</center>
</body>
</html>
"""
send_mail()
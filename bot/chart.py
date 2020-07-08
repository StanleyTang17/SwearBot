import sys
import datetime as dt
from matplotlib import pyplot as plt
import matplotlib.dates as mdates
from io import BytesIO
import base64

name = sys.argv[1]
dates = sys.argv[2].split(',')
usages = sys.argv[3].split(',')
x_data = [dt.datetime.strptime(d,'%m/%d/%Y').date() for d in dates]
y_data = [int(u) for u in usages]

plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%m/%d/%Y'))
plt.gca().xaxis.set_major_locator(mdates.DayLocator())
plt.plot(x_data, y_data)
plt.gcf().autofmt_xdate()

plt.xlabel('Date')
plt.ylabel('Swear Usage')
plt.title('Your Swear Usage')
plt.tight_layout()

buffer = BytesIO()
plt.savefig(buffer, format='png')
buffer.seek(0)
image_png = buffer.getvalue()
buffer.close()
graphic = base64.b64encode(image_png)
graphic = graphic.decode('utf-8')

print(graphic)
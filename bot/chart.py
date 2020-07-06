import sys
import datetime as dt
from matplotlib import pyplot as plt
import matplotlib.dates as mdates

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

plt.savefig('\\tmp\\' + name)
# plt.show()
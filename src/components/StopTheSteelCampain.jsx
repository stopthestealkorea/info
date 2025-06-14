import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Volume2,
  X,
  Share2,
  Calendar,
  ExternalLink
} from "lucide-react";

export default function StopTheSteelCampaign() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(13);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const eventListRef = useRef(null);
  const eventRefs = useRef({});

  const regions = ["전체", "서울", "경기", "강원", "충청", "전라", "경상", "제주"];

  const [daysSinceTaken, setDaysSinceTaken] = useState(0);

  // Add CSS for marquee animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes marquee {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      
      .animate-marquee {
        animation: marquee 15s linear infinite;
      }
      
      .animate-marquee:hover {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        setLoading(true);
        const response = await fetch("./schedule.json");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setScheduleData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load schedule data:", err);
        setError("집회 일정을 불러오는데 실패했습니다.");
        setScheduleData({ events: [] });
      } finally {
        setLoading(false);
      }
    };
    loadScheduleData();

    const today = new Date();
    const baseDate = new Date(2025, 5, 3);
    const diffTime = today.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    setDaysSinceTaken(diffDays);

  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!eventListRef.current) return;
      const container = eventListRef.current;
      const containerTop = container.scrollTop;
      let firstVisibleEvent = null;
      Object.entries(eventRefs.current).forEach(([eventId, element]) => {
        if (!element) return;
        const elementTop = element.offsetTop - container.offsetTop;
        if (elementTop >= containerTop - 10 && !firstVisibleEvent) {
          const event = (scheduleData?.events || []).find(e => e.id === parseInt(eventId));
          if (event) firstVisibleEvent = event;
        }
      });
      if (firstVisibleEvent && firstVisibleEvent.day !== selectedDay) {
        setSelectedDay(firstVisibleEvent.day);
        // 이벤트의 월이 현재 달력 월과 다르면 달력도 이동
        const eventMonth = firstVisibleEvent.month || 6;
        if (eventMonth !== currentDate.getMonth() + 1) {
          setCurrentDate(new Date(2025, eventMonth - 1, firstVisibleEvent.day));
        }
      }
    };
    const container = eventListRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [scheduleData, selectedDay, currentDate]);

  const changeMonth = direction => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(direction === "prev" ? newDate.getMonth() - 1 : newDate.getMonth() + 1);
      return newDate;
    });
  };

  const getMonthName = date => `${date.getMonth() + 1}월`;

  const filteredEvents = selectedRegion === "전체"
    ? (scheduleData?.events || [])
    : (scheduleData?.events || []).filter(e => e.region === selectedRegion);

  const currentMonthEvents = filteredEvents.filter(event => (event.month || 6) === currentDate.getMonth() + 1);

  const getEventDaysForCurrentMonth = () => {
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    return filteredEvents.filter(event => (event.month || 6) === currentMonth && 2025 === currentYear).map(e => e.day);
  };

  const getDaysInMonth = date => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = date => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateClick = day => {
    setSelectedDay(day);
    const dayEvents = currentMonthEvents.filter(event => event.day === day);
    if (dayEvents.length > 0) {
      const eventElement = eventRefs.current[dayEvents[0].id];
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
      }
    }
  };

  const handleEventClick = (event) => {
    // 이벤트의 월이 현재 달력 월과 다르면 달력을 해당 월로 이동
    const eventMonth = event.month || 6;
    if (eventMonth !== currentDate.getMonth() + 1) {
      setCurrentDate(new Date(2025, eventMonth - 1, event.day));
    }
    setSelectedDay(event.day);
    setSelectedEvent(event);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const eventDays = getEventDaysForCurrentMonth();

    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const hasEvent = eventDays.includes(day);
      const isSelected = day === selectedDay;
      days.push(
        <div
          key={day}
          className={`w-10 h-10 flex items-center justify-center text-sm font-medium cursor-pointer transition-colors
            ${hasEvent && isSelected ? 'bg-red-500 text-white rounded-full' : ''}
            ${hasEvent && !isSelected ? 'bg-red-300 text-white rounded-full' : ''}
            ${!hasEvent && isSelected ? 'bg-red-100 rounded-full text-red-600' : ''}
            ${!hasEvent && !isSelected ? 'text-gray-800 hover:bg-gray-100 rounded-full' : ''}`}
          onClick={() => handleDateClick(day)}
        >{day}</div>
      );
    }

    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className="w-10 h-10 flex items-center justify-center text-sm font-medium text-gray-400"
        >{currentDate.getMonth() === 5 ? `7/${day}` : day}</div>
      );
    }
    return days;
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-gray-200 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">집회 일정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-gray-200 h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-200 h-screen flex flex-col overflow-hidden">
      {/* Main Campaign Banner - Fixed */}
      <div className="bg-red-500 text-white px-6 py-4 flex-shrink-0">
        <h1 className="text-3xl font-bold mb-1">STOP THE STEEL</h1>
        <p className="text-sm mb-4">
          <span className="text-xl font-bold">{`${new Date().getMonth() + 1}월 ${new Date().getDate()}일`}</span>
          {`, 빼앗긴 지 ${daysSinceTaken}일째`}
        </p>

        {/* Today's Schedule Ticker */}
        <div className="bg-white text-gray-800 rounded-lg p-3">
          <div className="flex items-center">
            <Volume2 className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <span className="text-red-600 font-medium mr-3">금일 집회 : </span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="relative h-6 flex items-center animate-marquee">
                <div className="absolute whitespace-nowrap">
                  {(() => {
                    const today = new Date();
                    const todayMonth = today.getMonth() + 1;
                    const todayDay = today.getDate();

                    const todayEvents = (scheduleData?.events || []).filter(event =>
                      (event.month || 6) === todayMonth && event.day === todayDay
                    );

                    if (todayEvents.length === 0) {
                      return <span className="text-gray-600 font-medium">없음</span>;
                    }

                    const eventText = todayEvents.map(event =>
                      `${event.title}`
                    ).join(' • ');

                    return <span className="text-red-600 font-medium">{eventText}</span>;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section - Fixed */}
      <div className="bg-pink-50 px-6 py-4 flex-shrink-0">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button onClick={() => changeMonth('prev')} className="p-1 hover:bg-gray-200 rounded">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="mx-6 text-xl font-bold text-gray-800">{getMonthName(currentDate)}</span>
            <button onClick={() => changeMonth('next')} className="p-1 hover:bg-gray-200 rounded">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              className="flex items-center text-gray-600 border border-gray-300 rounded px-3 py-1 hover:bg-gray-50"
            >
              <span className="text-sm">{selectedRegion}</span>
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isRegionDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[100px]">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => {
                      setSelectedRegion(region);
                      setIsRegionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${selectedRegion === region ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700'
                      }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div key={day} className={`text-center text-sm font-medium py-2 ${index === 0 ? 'text-red-500' : 'text-gray-600'
                }`}>
                {day}
              </div>
            ))}
          </div>
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
      </div>

      {/* Scrollable Event List */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4 bg-pink-50"
        ref={eventListRef}
      >
        <div className="space-y-3">
          {filteredEvents.length > 0 ? (
            <>
              {filteredEvents.map((event, index) => (
                <div
                  key={event.id}
                  ref={el => eventRefs.current[event.id] = el}
                  className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-center">
                    <span className="text-red-500 font-bold mr-4 text-lg">{event.date}</span>
                    <div>
                      <span className="text-gray-800 font-medium block">{event.title}</span>
                      <span className="text-gray-500 text-sm">{event.region}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
              {/* 마지막 항목이 상단까지 올라갈 수 있도록 하는 여백 */}
              <div className="h-64"></div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>선택한 지역에 해당하는 집회가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Contact Bar */}
      <a
        href="mailto:stopthesteelkorea2025@gmail.com"
        className="fixed bottom-6 right-6 z-50 bg-white rounded-full shadow-lg border hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center px-4 py-2">
          <span className="text-sm font-semibold text-gray-800 mr-2 whitespace-nowrap">
            집회 정보 공유
          </span>
          <img src="./flag.png" alt="Flag" className="w-8 h-8 object-contain" />
        </div>
      </a>

      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedEvent(null);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-red-500">{selectedEvent.description}</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {/* Poster Image */}
              <div className="mb-4">
                <img
                  src={selectedEvent.posterImage}
                  alt={`${selectedEvent.description} 포스터`}
                  className="w-full h-64 object-cover rounded-lg bg-gray-800 flex items-center justify-center text-white"
                />
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-gray-600 font-medium mr-4 min-w-[60px]">장소</span>
                  <div className="flex items-center">
                    <span className="text-red-500 font-bold">{selectedEvent.location}</span>
                    <button
                      onClick={() => {
                        if (selectedEvent.mapUrl) {
                          window.open(selectedEvent.mapUrl, "_blank");
                        } else {
                          alert("지도 링크가 제공되지 않았습니다.");
                        }
                      }}
                      className="ml-2 w-16 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      <span className="text-gray-600 text-sm">지도</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="text-gray-600 font-medium mr-4 min-w-[60px]">시간</span>
                  <span className="text-red-500 font-bold">{selectedEvent.fullTime}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm flex items-center justify-center hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      const now = new Date();
                      const [monthStr, dayStr] = selectedEvent.date.split("/"); // "6/12" → ["6", "12"]
                      const [hourStr, minuteStr] = selectedEvent.time.split(":"); // "20:00" → ["20", "00"]

                      const year = now.getFullYear(); // 올해로 가정
                      const start = new Date(year, Number(monthStr) - 1, Number(dayStr), Number(hourStr), Number(minuteStr));
                      const end = new Date(start.getTime() + 60 * 60 * 1000); // 종료시간은 시작 후 1시간으로 가정

                      const pad = (n) => String(n).padStart(2, '0');
                      const formatDate = (date) => {
                        return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
                      };

                      const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YourApp//ScheduleEvent//EN
BEGIN:VEVENT
UID:${Date.now()}@yourapp.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${selectedEvent.title}
LOCATION:${selectedEvent.location}
DESCRIPTION:${selectedEvent.description}
END:VEVENT
END:VCALENDAR`.trim();

                      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `${selectedEvent.title}.ics`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    내 캘린더에 추가
                  </button>

                  <button
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center hover:bg-red-600 transition-colors"
                    onClick={() => {
                      const { title, description, location, date, time } = selectedEvent;
                      const shareText = `[집회 알림] ${title}\n날짜: ${date}, 시간: ${time}\n장소: ${location}\n\n${description}`;
                      const shareUrl = window.location.href;

                      if (navigator.share) {
                        navigator
                          .share({
                            title: `STOP THE STEEL - ${title}`,
                            text: shareText,
                            url: shareUrl,
                          })
                          .catch(err => console.error("공유 실패:", err));
                      } else {
                        alert("현재 브라우저에서는 공유 기능을 지원하지 않습니다.");
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    함께 하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown 외부 클릭 시 닫기 */}
      {isRegionDropdownOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsRegionDropdownOpen(false)}
        />
      )}
    </div>
  );
}
document.addEventListener("DOMContentLoaded", function () {
    var timelines = document.querySelectorAll(".cd-horizontal-timeline");
    var eventsMinDistance = 60;
  
    if (timelines.length > 0) {
      initTimeline(timelines);
    }
  
    function initTimeline(timelines) {
      timelines.forEach(function (timeline) {
        var timelineComponents = {};
        //cache timeline components
        timelineComponents["timelineWrapper"] = timeline.querySelector(".events-wrapper");
        timelineComponents["eventsWrapper"] = timelineComponents["timelineWrapper"].querySelector(".events");
        timelineComponents["fillingLine"] = timelineComponents["eventsWrapper"].querySelector(".filling-line");
        timelineComponents["timelineEvents"] = timelineComponents["eventsWrapper"].querySelectorAll("a");
        timelineComponents["timelineDates"] = parseDate(timelineComponents["timelineEvents"]);
        timelineComponents["eventsMinLapse"] = minLapse(timelineComponents["timelineDates"]);
        timelineComponents["timelineNavigation"] = timeline.querySelector(".cd-timeline-navigation");
        timelineComponents["eventsContent"] = timeline.querySelector(".events-content");
  
        //assign a left postion to the single events along the timeline
        setDatePosition(timelineComponents, eventsMinDistance);
        //assign a width to the timeline
        var timelineTotWidth = setTimelineWidth(timelineComponents, eventsMinDistance);
        //the timeline has been initialize - show it
        timeline.classList.add("loaded");
  
        //detect click on the next arrow
        timelineComponents["timelineNavigation"].querySelector(".next").addEventListener("click", function (event) {
          event.preventDefault();
          updateSlide(timelineComponents, timelineTotWidth, "next");
        });
        //detect click on the prev arrow
        timelineComponents["timelineNavigation"].querySelector(".prev").addEventListener("click", function (event) {
          event.preventDefault();
          updateSlide(timelineComponents, timelineTotWidth, "prev");
        });
        //detect click on the a single event - show new event content
        timelineComponents["eventsWrapper"].addEventListener("click", function (event) {
          if (event.target.tagName.toLowerCase() === "a") {
            event.preventDefault();
            timelineComponents["timelineEvents"].forEach(function (item) {
              item.classList.remove("selected");
            });
            event.target.classList.add("selected");
            updateOlderEvents(event.target);
            updateFilling(event.target, timelineComponents["fillingLine"], timelineTotWidth);
            updateVisibleContent(event.target, timelineComponents["eventsContent"]);
          }
        });
  
        //keyboard navigation
        document.addEventListener("keyup", function (event) {
          if (event.which == "37" && elementInViewport(timeline)) {
            showNewContent(timelineComponents, timelineTotWidth, "prev");
          } else if (event.which == "39" && elementInViewport(timeline)) {
            showNewContent(timelineComponents, timelineTotWidth, "next");
          }
        });
      });
    }
  
    function updateSlide(timelineComponents, timelineTotWidth, string) {
      //retrieve translateX value of timelineComponents['eventsWrapper']
      var translateValue = getTranslateValue(timelineComponents["eventsWrapper"]);
      var wrapperWidth = Number(timelineComponents["timelineWrapper"].style.width.replace("px", ""));
      //translate the timeline to the left('next')/right('prev')
      string == "next" ?
        translateTimeline(timelineComponents, translateValue - wrapperWidth + eventsMinDistance, wrapperWidth - timelineTotWidth) :
        translateTimeline(timelineComponents, translateValue + wrapperWidth - eventsMinDistance);
    }
  
    function showNewContent(timelineComponents, timelineTotWidth, string) {
      //go from one event to the next/previous one
      var visibleContent = timelineComponents["eventsContent"].querySelector(".selected");
      var newContent = string == "next" ? visibleContent.nextElementSibling : visibleContent.previousElementSibling;
  
      if (newContent !== null) {
        //if there's a next/prev event - show it
        var selectedDate = timelineComponents["eventsWrapper"].querySelector(".selected");
        var newEvent = string == "next" ? selectedDate.parentElement.nextElementSibling.querySelector("a") : selectedDate.parentElement.previousElementSibling.querySelector("a");
  
        updateFilling(newEvent, timelineComponents["fillingLine"], timelineTotWidth);
        updateVisibleContent(newEvent, timelineComponents["eventsContent"]);
        newEvent.classList.add("selected");
        selectedDate.classList.remove("selected");
        updateOlderEvents(newEvent);
        updateTimelinePosition(string, newEvent, timelineComponents, timelineTotWidth);
      }
    }
  
    function updateTimelinePosition(string, event, timelineComponents, timelineTotWidth) {
      //translate timeline to the left/right according to the position of the selected event
      var eventStyle = window.getComputedStyle(event);
      var eventLeft = Number(eventStyle.getPropertyValue("left").replace("px", ""));
      var timelineWidth = Number(timelineComponents["timelineWrapper"].style.width.replace("px", ""));
      var timelineTranslate = getTranslateValue(timelineComponents["eventsWrapper"]);
  
      if ((string == "next" && eventLeft > timelineWidth - timelineTranslate) ||
        (string == "prev" && eventLeft < -timelineTranslate)) {
        translateTimeline(timelineComponents, -eventLeft + timelineWidth / 2, timelineWidth - timelineTotWidth);
      }
    }
  
    function translateTimeline(timelineComponents, value, totWidth) {
      var eventsWrapper = timelineComponents["eventsWrapper"];
      value = value > 0 ? 0 : value; //only negative translate value
      value = !(typeof totWidth === "undefined") && value < totWidth ? totWidth : value; //do not translate more than timeline width
      setTransformValue(eventsWrapper, "translateX", value + "px");
      //update navigation arrows visibility
      value == 0 ?
        timelineComponents["timelineNavigation"].querySelector(".prev").classList.add("inactive") :
        timelineComponents["timelineNavigation"].querySelector(".prev").classList.remove("inactive");
      value == totWidth ?
        timelineComponents["timelineNavigation"].querySelector(".next").classList.add("inactive") :
        timelineComponents["timelineNavigation"].querySelector(".next").classList.remove("inactive");
    }
  
    function updateFilling(selectedEvent, filling, totWidth) {
      //change .filling-line length according to the selected event
      var eventStyle = window.getComputedStyle(selectedEvent);
      var eventLeft = Number(eventStyle.getPropertyValue("left").replace("px", ""));
      var eventWidth = Number(eventStyle.getPropertyValue("width").replace("px", ""));
      eventLeft += eventWidth / 2;
      var scaleValue = eventLeft / totWidth;
      setTransformValue(filling, "scaleX", scaleValue);
    }
  
    function setDatePosition(timelineComponents, min) {
      for (var i = 0; i < timelineComponents["timelineDates"].length; i++) {
        var distance = daydiff(
          timelineComponents["timelineDates"][0],
          timelineComponents["timelineDates"][i]
        );
        var distanceNorm = Math.round(distance / timelineComponents["eventsMinLapse"]) + 2;
        timelineComponents["timelineEvents"][i].style.left = distanceNorm * min + "px";
      }
    }
  
    function setTimelineWidth(timelineComponents, width) {
      var timeSpan = daydiff(
        timelineComponents["timelineDates"][0],
        timelineComponents["timelineDates"][timelineComponents["timelineDates"].length - 1]
      );
      var timeSpanNorm = timeSpan / timelineComponents["eventsMinLapse"];
      var timeSpanNorm = Math.round(timeSpanNorm) + 4;
      var totalWidth = timeSpanNorm * width;
      timelineComponents["eventsWrapper"].style.width = totalWidth + "px";
      updateFilling(timelineComponents["timelineEvents"][0], timelineComponents["fillingLine"], totalWidth);
  
      return totalWidth;
    }
  
    function updateVisibleContent(event, eventsContent) {
      var eventDate = event.getAttribute("data-date");
      var visibleContent = eventsContent.querySelector(".selected");
      var selectedContent = eventsContent.querySelector('[data-date="' + eventDate + '"]');
      var selectedContentHeight = selectedContent.offsetHeight;
  
      if (selectedContent.compareDocumentPosition(visibleContent) === 4) {
        var classEnetering = "selected enter-right";
        var classLeaving = "leave-left";
      } else {
        var classEnetering = "selected enter-left";
        var classLeaving = "leave-right";
      }
  
      selectedContent.setAttribute("class", classEnetering);
      visibleContent.setAttribute("class", classLeaving);
      visibleContent.addEventListener("animationend", function () {
        visibleContent.classList.remove("leave-right", "leave-left");
        selectedContent.classList.remove("enter-left", "enter-right");
      });
      eventsContent.style.height = selectedContentHeight + "px";
    }
  
    function updateOlderEvents(event) {
      var parent = event.parentElement;
      var prevSiblings = [];
      while ((parent = parent.previousElementSibling) !== null) {
        prevSiblings.unshift(parent.querySelector("a"));
      }
      var nextSiblings = [];
      parent = event.parentElement;
      while ((parent = parent.nextElementSibling) !== null) {
        nextSiblings.push(parent.querySelector("a"));
      }
      prevSiblings.forEach(function (item) {
        item.classList.add("older-event");
      });
      nextSiblings.forEach(function (item) {
        item.classList.remove("older-event");
      });
    }
  
    function getTranslateValue(timeline) {
      var timelineStyle = window.getComputedStyle(timeline);
      var timelineTranslate = timelineStyle.getPropertyValue("-webkit-transform") ||
        timelineStyle.getPropertyValue("-moz-transform") ||
        timelineStyle.getPropertyValue("-ms-transform") ||
        timelineStyle.getPropertyValue("-o-transform") ||
        timelineStyle.getPropertyValue("transform");
  
      if (timelineTranslate.indexOf("(") >= 0) {
        var timelineTranslate = timelineTranslate.split("(")[1];
        timelineTranslate = timelineTranslate.split(")")[0];
        timelineTranslate = timelineTranslate.split(",");
        var translateValue = timelineTranslate[4];
      } else {
        var translateValue = 0;
      }
  
      return Number(translateValue);
    }
  
    function setTransformValue(element, property, value) {
      element.style["-webkit-transform"] = property + "(" + value + ")";
      element.style["-moz-transform"] = property + "(" + value + ")";
      element.style["-ms-transform"] = property + "(" + value + ")";
      element.style["-o-transform"] = property + "(" + value + ")";
      element.style["transform"] = property + "(" + value + ")";
    }
  
    function parseDate(events) {
      var dateArrays = [];
      for (var i = 0; i < events.length; i++) {
        var dateComp = events[i].getAttribute("data-date").split("/");
        var newDate = new Date(dateComp[2], dateComp[1] - 1, dateComp[0]);
        dateArrays.push(newDate);
      }
      return dateArrays;
    }
  
    function daydiff(first, second) {
      return Math.round((second - first) / (1000 * 60 * 60 * 24));
    }
  
    function minLapse(dates) {
      //determine the minimum distance among events
      var dateDistances = [];
      for (var i = 1; i < dates.length; i++) {
        var distance = daydiff(dates[i - 1], dates[i]);
        dateDistances.push(distance);
      }
      return Math.min.apply(null, dateDistances);
    }
  
    function elementInViewport(el) {
      var rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }
  });
  
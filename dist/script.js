var $slider = $('.slideshow .slider'),
  maxItems = $('.item', $slider).length,
  dragging = false,
  tracking,
  rightTracking,
  isAnimating = false,  // Prevent multiple slides during fast swipes
  animationSpeed = 1000,  // Match the slide transition speed
  lastScrollTime = 0,  // Time-based throttle backup
  scrollCooldown = 1000,  // Minimum ms between scroll actions
  slideLocked = false,  // Keep a single slide per gesture until released
  postSlideUnlockDelay = 1000,
  postSlideUnlockTimeout;

$sliderRight = $('.slideshow').clone().addClass('slideshow-right').appendTo($('.split-slideshow'));

rightItems = $('.item', $sliderRight).toArray();
reverseItems = rightItems.reverse();
$('.slider', $sliderRight).html('');
for (i = 0; i < maxItems; i++) {
  $(reverseItems[i]).appendTo($('.slider', $sliderRight));
}

function lockScroll() {
  // Hold the slide lock until shortly after the new item is visible
  clearTimeout(postSlideUnlockTimeout);
  postSlideUnlockTimeout = setTimeout(function() {
    slideLocked = false;
    isAnimating = false;
    swipeHandled = false;
  }, postSlideUnlockDelay);
}

$slider.addClass('slideshow-left');

// Track touch start position for custom single-slide swipe
var touchStartY = 0;
var touchThreshold = 50;  // Minimum swipe distance to trigger slide change
var swipeHandled = false;  // Prevent multiple triggers per swipe

$('.slideshow-left').slick({
  vertical: true,
  verticalSwiping: false,  // Disable native swiping to control it manually
  arrows: false,
  infinite: true,
  dots: true,
  speed: animationSpeed,
  cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
  swipe: false,  // Disable native swipe
  touchMove: false  // Disable touch-based dragging
}).on('beforeChange', function(event, slick, currentSlide, nextSlide) {
  isAnimating = true;
  if (currentSlide > nextSlide && nextSlide == 0 && currentSlide == maxItems - 1) {
    $('.slideshow-right .slider').slick('slickGoTo', -1);
    $('.slideshow-text').slick('slickGoTo', maxItems);
  } else if (currentSlide < nextSlide && currentSlide == 0 && nextSlide == maxItems - 1) {
    $('.slideshow-right .slider').slick('slickGoTo', maxItems);
    $('.slideshow-text').slick('slickGoTo', -1);
  } else {
    $('.slideshow-right .slider').slick('slickGoTo', maxItems - 1 - nextSlide);
    $('.slideshow-text').slick('slickGoTo', nextSlide);
  }
}).on('afterChange', function(event, slick, currentSlide) {
  lockScroll();  // Release lock ~1s after the new slide is in view
}).on("mousewheel", function(event) {
  event.preventDefault();
  
  var now = Date.now();
  
  if (slideLocked || isAnimating || (now - lastScrollTime) < scrollCooldown) {
    return;
  }
  
  isAnimating = true;
  slideLocked = true;
  lastScrollTime = now;
  
  if (event.deltaX > 0 || event.deltaY < 0) {
    $(this).slick('slickNext');
  } else if (event.deltaX < 0 || event.deltaY > 0) {
    $(this).slick('slickPrev');
  } else {
    // No direction detected, unlock
    isAnimating = false;
    slideLocked = false;
    clearTimeout(postSlideUnlockTimeout);
  }
}).on('mousedown touchstart', function(e){
  dragging = true;
  swipeHandled = false;
  // Get touch Y position
  if (e.type === 'touchstart') {
    touchStartY = e.originalEvent.touches[0].clientY;
  } else {
    touchStartY = e.clientY;
  }
  tracking = $('.slick-track', $slider).css('transform');
  tracking = parseInt(tracking.split(',')[5]);
  rightTracking = $('.slideshow-right .slick-track').css('transform');
  rightTracking = parseInt(rightTracking.split(',')[5]);
}).on('mousemove touchmove', function(e){
  var now = Date.now();
  
  // Triple protection: swipeHandled flag, isAnimating flag, AND time-based throttle
  if (dragging && !isAnimating && !swipeHandled && !slideLocked && (now - lastScrollTime) >= scrollCooldown) {
    var currentY;
    if (e.type === 'touchmove') {
      currentY = e.originalEvent.touches[0].clientY;
    } else {
      currentY = e.clientY;
    }
    var diffY = touchStartY - currentY;

    // Check if swipe exceeds threshold - only trigger once per swipe
    if (Math.abs(diffY) > touchThreshold) {
      swipeHandled = true;  // Prevent multiple triggers
      slideLocked = true;   // Hold until the new slide settles
      isAnimating = true;   // Lock immediately before slick processes
      lastScrollTime = now; // Time-based lock
      if (diffY > 0) {
        // Swiped up - go to next slide
        $(this).slick('slickNext');
      } else {
        // Swiped down - go to previous slide
        $(this).slick('slickPrev');
      }
    }
  }
}).on('mouseleave touchend mouseup', function(){
  dragging = false;
  // Don't reset swipeHandled here - wait for animation to complete
});

$('.slideshow-right .slider').slick({
  swipe: false,
  vertical: true,
  arrows: false,
  infinite: true,
  speed: 950,
  cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
  initialSlide: maxItems - 1
});
$('.slideshow-text').slick({
  swipe: false,
  vertical: true,
  arrows: false,
  infinite: true,
  speed: 900,
  cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)'
});

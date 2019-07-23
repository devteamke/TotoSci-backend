/* =====================================
Template Name: Tromas
Author Name: Codeglim
Description: Tromas is a Multipurpose Business HTML5 Theme. It's Perfect for any business websites. You can customize every section as your need.
Version:	1.0
========================================*/    
/*=======================================
[Start Activation Code]
=========================================
	01. Sticky Header JS
	02. One Page Nav
	03. Mobile Nav JS
	04. Home Slider One
	05. Home Slider Two
	06. Mouse Moving JS
	07. Counter JS
	08. Team JS
	09. Testimonial JS
	10. Checkbox JS
	11. Clients Carousel JS
	12. Blog Slider JS
	13. Service Slider JS
	14. Countdown JS
	15. Project Single Slider JS
	16. Blog Archive Slider JS
	17. Sticky JS
	18. Parallax JS
	19. Animate Scroll JS
	20. Scroll Up JS
	21. Video Popup JS
	22. Google Map JS
	23. Extra JS
=========================================
[End Activation Code]
=========================================*/ 



(function ($) {
	"use strict";
    $(document).ready(function(){	
		
		/*====================================
		01. Sticky Header JS
		======================================*/ 
		jQuery(window).on('scroll', function() {
			if ($(this).scrollTop() > 100) {
				$('.header.onepage').addClass("sticky");
			} else {
				$('.header.onepage').removeClass("sticky");
			}
		});
		
		/*====================================
		02. Onepage Nav
		======================================*/ 
		if ($.fn.onePageNav) {
			$('.onepage .mainmenu .nav').onePageNav({
				currentClass: 'active',
				scrollSpeed: 1000,
				easing: 'easeInOutQuart'
			});
		}
		
		/*==============================
		03. Mobile Nav
		================================*/ 	
		$('.nav').slicknav({
			prependTo:".mobile-nav",
		});

		/*===============================
		04. Home Slider One
		=================================*/ 
		$(".slider-one").owlCarousel({
			loop:true,
			autoplay:true,
			smartSpeed: 700,
			autoplayTimeout:5000,
			autoplayHoverPause:true,
			center:false,
			nav:true,
			navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>'],
			dots:true,
			items:1,
			responsive:{
				300: {
					nav:false,
				},
				480: {
					nav:false,
				},
				768: {
					nav:false,
				},
				1170: {
					nav:true,
				},
			}
		});	
		
		/*===============================
		05. Home Slider Two
		=================================*/ 
		$(".slider-two").owlCarousel({
			loop:true,
			autoplay:false,
			smartSpeed: 700,
			autoplayTimeout:5000,
			autoplayHoverPause:true,
			center:false,
			nav:false,
			dots:true,
			items:1
		});	
		
		/*===============================
		06. Mouse Moving
		=================================*/ 
		$('.single-layer.one').mouseParallax({
			moveFactor: 3
		});
		$('.single-layer.two').mouseParallax({
			moveFactor: 3
		});
		$('.single-layer.three').mouseParallax({
			moveFactor: 3
		});
		$('.single-layer.four').mouseParallax({
			moveFactor: 3
		});	$('.single-layer.five').mouseParallax({
			moveFactor: 3
		});
		
		/*===============================
		07. Counter JS
		=================================*/  
		$('.number').counterUp({
			time: 1000
		});
		
		/*===============================
		08. Team JS
		=================================*/ 
		$('.single-team.one').on( "click", function(){
			$('.team-details.one').toggleClass('active');
		});		
		$('.single-team.two').on( "click", function(){
			$('.team-details.two').toggleClass('active');
		});		
		$('.single-team.three').on( "click", function(){
			$('.team-details.three').toggleClass('active');
		});		
		$('.single-team.four').on( "click", function(){
			$('.team-details.four').toggleClass('active');
		});	
		$('.team-details .cross').on( "click", function(){
			$('.team-details.one, .team-details.two, .team-details.three, .team-details.four').removeClass('active');
		});	
		$('.team-details').perfectScrollbar(); 
		
		/*===============================
		09. Testimonial JS
		=================================*/ 
		$(".testimonial-carousel").owlCarousel({
			loop:true,
			autoplay:false,
			smartSpeed: 700,
			center:false,
			margin:15,
			nav:true,
			navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>'],
			dots:false,
			items:1,
		});	
		
		/*===============================
		10. Checkbox JS
		=================================*/  
		$('input[type="checkbox"]').change(function(){
			if($(this).is(':checked')){
				$(this).parent("label").addClass("checked");
			} else {
				$(this).parent("label").removeClass("checked");
			}
		});
		
		/*===============================
		11. Clients Carousel
		=================================*/ 
		$(".clients-slider").owlCarousel({
			loop:true,
			autoplay:true,
			smartSpeed: 500,
			autoplayTimeout:3000,
			margin:30,
			nav:false,
			navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>'],
			dots:false,
			responsive:{
				300: {
					items: 2,
				},
				480: {
					items: 3,
				},
				768: {
					items: 4,
				},
				1170: {
					items: 6,
				},
			}
		});	
		
		/*===============================
		12. Blog Slider
		=================================*/ 
		$(".blog-slider").owlCarousel({
			loop:true,
			autoplay:true,
			smartSpeed: 700,
			autoplayTimeout:4000,
			margin:30,
			nav: true,
			dots:false,
			navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>'],
			responsive:{
				300: {
					items: 1,
				},
				480: {
					items: 1,
				},
				768: {
					items: 2,
				},
				1170: {
					items: 3,
				},
			}
		});
	
		/*======================================
		13. Services Slider
		======================================*/ 
		$(".services-slider").owlCarousel({
			loop:true,
			autoplay:false,
			smartSpeed: 700,
			autoplayTimeout:5000,
			center:false,
			margin:15,
			nav:true,
			navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>'],
			dots:false,
			items:1
		});	
		
		/*=====================================
		14. CountDown
		======================================*/ 
		$('[data-countdown]').each(function() {
			var $this = $(this),
				finalDate = $(this).data('countdown');
			$this.countdown(finalDate, function(event) {
				$this.html(event.strftime(
					'<div class="cdown"><span class="days"><strong>%-D</strong><p>Days.</p></span></div><div class="cdown"><span class="hour"><strong> %-H</strong><p>Hours.</p></span></div> <div class="cdown"><span class="minutes"><strong>%M</strong> <p>MINUTES.</p></span></div><div class="cdown"><span class="second"><strong> %S</strong><p>SECONDS.</p></span></div>'
				));
			});
		});
		
		/*======================================
		15. Project Single Slider JS
		======================================*/ 
		$('.bxslider').bxSlider({
			pagerCustom: '#bx-pager',
			controls: false,
		});
		
		/*=====================================
		16. Blog Archive Slider JS
		======================================*/ 
		$(".blog-slide").owlCarousel({
			autoplay:false,
			loop:true,
			smartSpeed: 700,
			autoplayTimeout:5000,
			autoplayHoverPause:true,
			center:false,
			items:1,
			margin:0,
			dots:false,
			nav: true,
			navText: ['<i class="fa fa-angle-left" aria-hidden="true"></i>', '<i class="fa fa-angle-right" aria-hidden="true"></i>'],
		});
		
		/*=====================================
		17. Sticky JS
		======================================*/ 
		$('.sticky-area')
            .theiaStickySidebar({
                additionalMarginTop: 0
		});

		/*======================================
		18. Parallax JS
		======================================*/ 
		$(window).stellar({
            responsive: true,
            positionProperty: 'position',
            horizontalScrolling: false
        });
		
		/*======================================
		19. Animate Scroll JS
		======================================*/ 
		$('.btn, .slicknav_nav li a').on('click', function(event) {
			var $anchor = $(this);
			$('html, body').stop().animate({
				scrollTop: $($anchor.attr('href')).offset().top -0 
			}, 1000, 'easeInOutQuart');
			event.preventDefault();
		});
		
		/*=====================================
		20. Scroll Up
		======================================*/ 
		$.scrollUp({
			scrollName: 'scrollUp',      // Element ID
			scrollDistance: 300,         // Distance from top/bottom before showing element (px)
			scrollFrom: 'top',           // 'top' or 'bottom'
			scrollSpeed: 1000,            // Speed back to top (ms)
			easingType: 'easeInOutQuart',        // Scroll to top easing (see http://easings.net/)
			animation: 'fade',           // Fade, slide, none
			animationSpeed: 200,         // Animation speed (ms)
			scrollTrigger: false,        // Set a custom triggering element. Can be an HTML string or jQuery object
			scrollTarget: false,         // Set a custom target element for scrolling to. Can be element or number
			scrollText: ["<i class='fa fa-angle-up'></i>"], // Text for element, can contain HTML
			scrollTitle: false,          // Set a custom <a> title if required.
			scrollImg: false,            // Set true to use image
			activeOverlay: false,        // Set CSS color to display scrollUp active point, e.g '#00FFFF'
			zIndex: 2147483647           // Z-Index for the overlay
		});
    });
		/*=====================================
		21. Video Popup
		======================================*/ 
		$('.video-popup').magnificPopup({
			type: 'iframe',
			removalDelay: 300,
			mainClass: 'mfp-fade'
		});
		
		/*=====================================
		22. Google Map
		======================================*/ 
		if ($('#myMap').length > 0) {
			//set your google maps parameters
			var $latitude = 40.716304, //If you unable to find latitude and longitude of your address. Please visit http://www.latlong.net/convert-address-to-lat-long.html you can easily generate.
				$longitude = -73.995763,
				$map_zoom = 16 /* ZOOM SETTING */

			//google map custom marker icon 
			var $marker_url = 'images/pin.png';

			//we define here the style of the map
			var style = [{
				"stylers": [{
					"hue": "#000"
				}, {
					"saturation": -70
				}, {
					"gamma": 2.15
				}, {
					"lightness": 12
				}]
			}];

			//set google map options
			var map_options = {
				center: new google.maps.LatLng($latitude, $longitude),
				zoom: $map_zoom,
				panControl: true,
				zoomControl: true,
				mapTypeControl: true,
				streetViewControl: true,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				scrollwheel: false,
				styles: style
			}
			//inizialize the map
			var map = new google.maps.Map(document.getElementById('myMap'), map_options);
			//add a custom marker to the map                
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng($latitude, $longitude),
				map: map,
				visible: true,
				icon: $marker_url
			});

			var contentString = '<div id="mapcontent">' + '<p>Tromas World, 123 Folsom Ave, San Francisco.</p></div>';
			var infowindow = new google.maps.InfoWindow({
				maxWidth: 320,
				content: contentString
			});

			google.maps.event.addListener(marker, 'click', function() {
				infowindow.open(map, marker);
			});
		   
		};

		/*====================================
		23. Extra JS
		======================================*/
		$('#header .search').on( "click", function(){
			$('.search-form, .search').toggleClass('active');
		});		
		
		$('#coming-soon .button .btn,.subscription-form .cross').on( "click", function(){
			$('.subscription-form').toggleClass('active');
		});	
		
		$('.panel').on('click', function() {
            $(".panel").removeClass("active");
            $(this).addClass("active");
		});
		
	
})(jQuery);	
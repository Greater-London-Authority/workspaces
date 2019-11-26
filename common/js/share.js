share = function() {
  swal({
      title: "Share",
      text: "<div id='share_div' style='margin-bottom:-5px'>Loading...</div>",
      html: true,
      confirmButtonText: "Done"
  });

  $("head").append("<link href='/common/css/jssocials.css' rel='stylesheet'>");
  // NOTE: font-awesome uses some funny webfonts, you may need to support their MIMETYPE in web server config
  $("head").append("<link href='/common/css/font-awesome.min.css' rel='stylesheet'>");

  jQuery.ajax({
      url: "/common/js/jssocials.min.js",
      dataType: "script",
      cache: true
  }).done(function() {
    		var sites = ["email", "twitter", "facebook", "googleplus", "linkedin"];
        if (typeof(is_mobile) == 'function') {
          if (is_mobile()) sites.push("whatsapp");
        }
    		$("#share_div").jsSocials({
    			showLabel: false,
    			showCount: false,
    			shares: sites
    		});
  }).fail(function() {
    db( "couldn't load /common/js/jssocials.min.js" );
  });

}

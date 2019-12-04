require([
  "esri/IdentityManager",
  "dojo/cookie",
  "esri/geometry/screenUtils",
  "esri/dijit/InfoWindow",
  "esri/map",
  "esri/layers/FeatureLayer",
  "esri/request",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/symbols/PictureMarkerSymbol",
  "esri/graphic",
  "esri/layers/GraphicsLayer",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/renderers/ClassBreaksRenderer",
  "esri/renderers/UniqueValueRenderer",
  "esri/renderers/SimpleRenderer",
  "esri/Color",
  "esri/urlUtils",
  "esri/dijit/Search",
  "esri/tasks/locator",
  "esri/dijit/LocateButton",
  "esri/InfoTemplate",
  "esri/virtualearth/VETiledLayer",
  "js/ClusterFeatureLayer.js",
  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/layers/WebTiledLayer",
  "esri/geometry/webMercatorUtils",
], function(
  esriId,
  cookie,
  screenUtils,
  InfoWindow,
  Map,
  FeatureLayer,
  esriRequest,
  ArcGISDynamicMapServiceLayer,
  PictureMarkerSymbol,
  Graphic,
  GraphicsLayer,
  SimpleLineSymbol,
  SimpleMarkerSymbol,
  ClassBreaksRenderer,
  UniqueValueRenderer,
  SimpleRenderer,
  Color,
  urlUtils,
  Search,
  Locator,
  LocateButton,
  InfoTemplate,
  VETiledLayer,
  ClusterFeatureLayer,
  ArcGISTiledMapServiceLayer,
  WebTiledLayer,
  webMercatorUtils
) {
  /******* Initialise Variables *******/

  //var service_dir = "https://maps.glatest.org.uk/arcgis/rest/services/TEST/"
  var service_dir = "https://maps.london.gov.uk/gla/rest/services/apps/"
  var mapservice = is_admin
    ? service_dir + "Workspaces_service_editable_service_01/FeatureServer/0"
    : service_dir +
      "Workspaces_service_editable_verified_service_01/MapServer/0"

  var initial_extent = pad_extent_by_panel(zoomed_out_central_london())

  var check_extent,
    highlight_search,
    update_clusterer_flag,
    update_pins_flag,
    last_thumb,
    satellite,
    do_home_reset
  var clusterLayer,
    filter,
    all_points_clusterer,
    last_filter,
    last_hover,
    bm,
    light_pins,
    check_points_delay
  var is_minimised = false

  var isIE = /*@cc_on!@*/ false || window.navigator.msPointerEnabled

  var last_zoom = 14 //Default zoom level
  var points_level = 12 //Level where clusters become points

  if (get_var("colour") == 1) {
    var colours = {
      Office: "#9E0059", //red
      Artist: "#175177", //blue
      Maker: "#009E65", //green
      Incubator: "#FFCC00", //yellow
      Accelerator: "#FF6A00", //orange
      Kitchen: "#002975", //darkblue
    }
  } else {
    var colours = {
      Office: "#9E0059", //red
      Artist: "#9E0059", //red
      Maker: "#9E0059", //red
      Incubator: "#9E0059", //red
      Accelerator: "#9E0059", //red
      Kitchen: "#9E0059", //red
    }
  }

  var filter_service_data = {
    Office: [
      "Bike Storage",
      "Business Support",
      "Cafe",
      "Creche",
      "Dark Room",
      "Events",
      "Gallery",
      "Lockers",
      "Meeting Rooms",
      "Outdoor Space",
      "Parking",
      "Reception",
      "Showers",
      "Workshops",
    ],
  }
  var extra_service_data = ["Hot Desking", "Fibre Connection"] //Add fields that you want people to be able to select when they add/edit, but doesn't show up as a filter yet (at least until the number of people with this option increases

  //Clean up from the old version of the system, before they changed it radically
  filter_service_data["Artist"] = filter_service_data["Office"]
  filter_service_data["Maker"] = filter_service_data["Office"]
  filter_service_data["Incubator"] = filter_service_data["Office"]
  filter_service_data["Accelerator"] = filter_service_data["Office"]
  filter_service_data["Kitchen"] = filter_service_data["Office"]

  var service_data = $.extend({}, filter_service_data)
  for (var i in service_data)
    service_data[i] = service_data[i].concat(extra_service_data)

  var sector_data = {
    Office: [
      "Architecture",
      "Art in public places",
      "Bespoke furniture",
      "Brand Consultancy",
      "Ceramics",
      "Clothing and Fashion",
      "Communications",
      "Computing and Electronics",
      "Cultural",
      "Designer-Makers",
      "Digital",
      "Digital technology",
      "Education and Training",
      "Film and video",
      "Film makers",
      "Finance",
      "Fine arts and crafts",
      "Glassmaking",
      "Healthcare",
      "Installation",
      "Jewellery",
      "Jewellery and precious metals",
      "Live art",
      "Management Consultancy",
      "Marketing",
      "Metalwork",
      "Millinery",
      "Multi media",
      "Music and Photography",
      "Other",
      "Painting",
      "Photography",
      "Printmaking",
      "Product Design",
      "Production",
      "Publishing",
      "Sciences",
      "Screenprinting",
      "Sculpture",
      "Smart Cities Technology",
      "Social Enterprise and Charity",
      "Textiles",
      "Traditional crafts",
      "TV",
      "Upcycling",
      "Woodwork",
    ],
  }
  sector_data["Artist"] = service_data["Office"]
  sector_data["Maker"] = service_data["Office"]

  var charges_data = {
    Office: [
      "Average_office_rent",
      [
        "Co-working resident: less than £125 per month",
        "Co-working resident: £125-£200 per month",
        "Co-working resident: £200-£250 per month",
        "Co-working resident: £250-£275 per month",
        "Co-working resident: £300+ per month",
        "Fixed desk: less than £250 per month",
        "Fixed desk: £250-£300 per month",
        "Fixed desk: £300-£375 per month",
        "Fixed desk: £375-£450 per month",
        "Fixed desk: £450+ per month",
        "Flexible: less than £65 per month",
        "Flexible: £65-£95 per month",
        "Flexible: £95-£145 per month",
        "Flexible: £145-£200 per month",
        "Flexible: £200+ per month",
        "Hot desk: less than £20 per day",
        "Hot desk: £20-£30 per day",
        "Hot desk: £30-£50 per day",
        "Hot desk: £50-£65 per day",
        "Hot desk: £65+ per day",
      ],
    ],
    Artist: [
      "Average_studio_rent",
      ["Free", "Less than £8", "£8 - £11", "£11 - £19", "More than £19"],
    ],
    Maker: [
      "access_criteria",
      [
        "Day rate access",
        "Free workshops",
        "Membership",
        "Paid courses only",
        "Studio space",
      ],
    ],
  }

  var ignore_fields = [
    "objectid",
    "sectors_catered_for",
    "services",
    "borough",
    "edit_id",
    "site_id",
    "verified",
    "photo",
    "x",
    "y",
    "shape",
  ] //["OBJECTID", "Shape", "opening_times_weekday", "opening_times_weekend", "POINT_X", "POINT_Y" ];
  var admin_only_fields = [
    "contact_email",
    "if_lease___sublease_how_many_ye",
    "do_you_expect_to_be_able_to_ren",
    "contacted",
    "contact___complete_priority",
    "known_contact",
    "completed_",
    "update_date",
  ]
  var fields_order = [
    "site_name",
    "site_type",
    "address",
    "post_code",
    "website",
    "facebook",
    "twitter",
  ]
  var required_fields = ["site_name"]
  var fields_require_ints = [
    "year_established__site_",
    "gross_internal_area__sqft_",
    "number_of_occupants",
    "number_of_desks__studios__workb",
    "cost_of_studios__£_sqft_pa_",
    "cost_month__exact_",
    "if_lease___sublease_how_many_ye",
  ]
  var fields_require_website = ["website", "twitter", "facebook"]
  var fields_require_email = [] //"contact_email"];

  var info_buttons = {
    workspace_provider: "Name of the company that owns this Workspace.",
    facebook: "The full URL link to your Facebook Page.",
    twitter: "The full URL link to your Twitter profile page.",
  }

  var boolean_dropdown = ["", "No", "Yes"]
  var field_dropdowns = {
    site_type: [
      ["Co-working", "Co-working"],
      ["Artist studios", "Artist"],
      ["Makerspace", "Maker"],
      ["Accelerator", "Accelerator"],
      ["Incubator", "Incubator"],
      ["Kitchen", "Kitchen"],
    ],
    do_you_expect_to_be_able_to_ren: boolean_dropdown,
    contacted: boolean_dropdown,
    completed_: boolean_dropdown,
    provision_type: ["", "Desks", "Studios", "Workbenches"],
    occupant_type: [
      "",
      "Businesses",
      "Co-workers",
      "Members",
      "Studio Users",
      "Workshop Users",
    ],
    cost_month_type: [
      "",
      "Co-working desk",
      "Fixed desk",
      "Full day access",
      "Workbench",
      "Workshop membership",
      "Workshop membership + Pay as you go",
    ],
    company_status: [
      "",
      "Charity",
      "Charity (college)",
      "Charity (university)",
      "Community benefit society",
      "Community Interest Company",
      "Company Limited by Guarantee",
      "Cooperative",
      "Limited Liability Partnership",
      "Local authority",
      "Not for profit organisation",
      "Private Limited Company",
      "Public Limited Company",
      "Social Enterprise Company",
      "Other",
    ],
    tenure_type: ["", "Leasehold", "Licence", "Other", "Unknown"],
  }

  /******** Main Code *********/

  /*urlUtils.addProxyRule({
		urlPrefix: "maps.london.gov.uk",
		proxyUrl: "https://maps.london.gov.uk/proxy/proxy.ashx"
	});*/

  //esri.config.defaults.io.corsEnabledServers.push("http://maps.london.gov.uk");
  //	esri.config.defaults.io.corsEnabledServers.push("maps.london.gov.uk");

  credentials = create_credentials()

  locations = create_pins()

  var london_boundary = new FeatureLayer(
    service_dir + "common_boundaries_service_02/MapServer/0",
    { id: "gla_boundary" }
  )

  map = create_map()

  map.addLayers([london_boundary, locations])

  resize_panel()
  $(window).resize(resize_panel)

  swal.setDefaults({
    html: true,
    confirmButtonColor: "#9E0059",
    html: true,
    allowOutsideClick: true,
  })

  workspace = create_workspace_controller()

  hash = setup_hash()

  /************ Widgets ************/
  var s = new Search(
    {
      map: map,
      enableInfoWindow: false,
      enableSourcesMenu: false,
      zoomScale: 4000,
      sourceCountry: "GB",
      activeSourceIndex: "all",
      allPlaceholder: "Find address or workspace",
      sources: [
        {
          featureLayer: locations,
          searchFields: ["site_name"],
          suggestionTemplate: "${site_name}",
          exactMatch: false,
          outFields: ["*"],
          name: "Workspaces",
          maxResults: 6,
          maxSuggestions: 6,
          enableSuggestions: true,
          minCharacters: 3,
          searchQueryParams: { distance: 5000 },
        },
        {
          locator: new Locator(
            "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
          ),
          singleLineFieldName: "SingleLine",
          countryCode: "UK",
          outFields: ["Addr_type"],
          name: "London",
          minCharacters: 3,
          localSearchOptions: {
            minScale: 300000,
            distance: 50000,
          },
          searchExtent: new esri.geometry.Extent(
            -67560,
            6668811,
            41438,
            6753350,
            new esri.SpatialReference({ wkid: 102100 })
          ),
        },
      ],
    },
    "search"
  )
  s.startup()
  s.on("search-results", workspace.minimise)
  s.on("select-result", function(e) {
    try {
      var ref = e.result.feature.attributes.objectid
      if (ref) highlight_search = ref
    } catch (err) {}
  })

  geoLocate = new LocateButton(
    { map: map, highlightLocation: false, scale: 8000, theme: "findme" },
    "LocateButton"
  )
  $(".findme").on("click", function() {
    show_loader(true)
  })
  geoLocate.on("locate", function(e) {
    show_loader(false)
    workspace.minimise()
  })

  $(".findme").on("click", function() {
    show_loader(true)
    $(this).addClass("searching")
  })
  geoLocate.on("locate", function(e) {
    try {
      show_loader(false)
      $(".findme").removeClass("searching")
    } catch (err) {
      $(".findme").css("display", "none")
    }
  })

  geoLocate.startup()

  /************ Functions that need accessing outside this code block ************/

  about_map = function() {
    var timeStamp = Math.floor(Date.now() / 1000)
    var extra = is_mobile()
      ? ""
      : "<br><br>The London Open Workspaces map makes the locations and services of over 400 workspaces publicly available and is an invaluable resource for anyone with an idea that has outgrown their kitchen table."
    var other_logo
    if (timeStamp > 1482386400 || getvar("show_new_logo")) {
      other_logo =
        "<img src='images/leap_logo_bigger.jpg' style='margin-left:-10px'>"
    } else {
      other_logo = "<img src='images/lep_black.png' style='height:30px'>"
    }
    swal(
      'On Tue 12 Dec additions and suggested edits will not be saved'//"OPEN WORKSPACES",
//       'On Tue 12 Dec additions and suggested edits will not be saved'
//       "<div style='text-align:left'>This map is an interactive guide to London's incubators and co-working spaces alongside other start-up workspaces, artists' studios and maker-spaces. " +
//         extra +
//         "</div><div id='logos' style='margin-top:10px;opacity:0.8;text-align:center'>" +
//         other_logo +
//         "<div><img id='mol_about_logo' src='images/mol_black.jpg' style='height:36px;margin-top:20px'></div></div>",
//       "info"
    )
  }

  disclaimer = function() {
    swal(
      "DISCLAIMER",
      "<div style='text-align:left; overflow-y: scroll; max-height:20em;'>Please note that links to websites outside of the <a href='https://maps.london.gov.uk/workspaces/'>London Open Workspaces Map</a> do not constitute official endorsements or approval by the London Growth Hub or London Economic Action Partnership (LEAP) of any private or public sector website, product, or service.<br><br>" +
        "We cannot be responsible for the privacy policies and practices of other sites, even if you access them using links from our Site, and we therefore recommend that you check the privacy policy of each site that you visit.<br><br>" +
        "If you linked to our Site from a third-party site, we cannot be responsible for the privacy policies and practices of the owners or operators of that third party site, and we therefore recommend that you check the policy of that third party site, and contact its owner or operator if you have any concerns or questions.<br><br>" +
        "If you wish to raise a concern about the London Open Workspaces Map or a site you were linked to via the map please email <a href='mailto:GrowthHub@london.gov.uk'>GrowthHub@london.gov.uk</a>.<br><br>" +
        "The London Growth Hub’s full terms can be found here:" +
        '<ul><li><a href="https://www.growthhub.london/terms-of-service/">Terms & Conditions</a></li>' +
        '<li><a href="https://www.growthhub.london/privacy-policy/">Privacy Policy</a></li></ul></div>',
      ""
    )
  }

  check_for_auto_show_about_popup()

  help_verify_edits = function() {
    swal(
      "Verifying Edits",
      "The values in the dropdown-boxes are edits that users of this map have made on this Workspace. You can choose to select the [Ignore Edits] option to ignore an edit, or you can select an edit from the dropdown to set it live (though this will not happen till after you click the Verify button). <br><br> If there is more than 1 other value in a dropdown box, that means that there has been more than 1 edit made to the same piece of data.  The further down the dropdown-box that an edit is listed, the more recently that edit was made.",
      "info"
    )
  }

  minimise = function(b) {
    is_minimised = b !== false
    var move_by = is_minimised ? -($("#panel").width() + 20) : 0
    if (!is_minimised) $("#menu_button").hide()
    $("#panel").animate({ "margin-left": move_by }, function() {
      if (is_minimised) {
        $("#menu_button").fadeIn()
      }
    })
  }

  do_filter = function(id, loading) {
    var dept = workspace_type()

    var filters = [] //["X IS NOT NULL"];
    var has_filters = false

    $("#filters").toggleClass("new_mode", dept == "New")

    if (dept == "New") {
      filters.push("verified=0")
    } else {
      filters.push("verified=1")

      var basic_filter_num = filters.length

      //Check workspace types
      var types = []
      $("#workspace_types input:checked").each(function() {
        types.push("site_type='" + $(this).val() + "'")
      })
      if (types.length > 0) filters.push("(" + types.join(" OR ") + ")")

      //Check services
      $("#" + dept + "_services input:checked").each(function() {
        filters.push("upper(services) LIKE upper('%" + $(this).val() + "%')")
      })

      //Check sectors
      var sector = $("#sectors select").val()
      if (sector && sector != -1)
        filters.push(
          "upper(sectors_catered_for) LIKE upper('%" + sector + "%')"
        )

      //Check pricing
      //var charge = $("#"+dept+"_charge select").val();
      //if (charge && charge!=-1) filters.push( "upper("+charges_data[dept][0]+") LIKE upper('%"+charge+"%')" );

      var price_filter = workspace.prices.get_filter()
      if (price_filter) filters.push(price_filter)

      var price_filter2 = workspace.prices2.get_filter()
      if (price_filter2) filters.push(price_filter2)

      has_filters = basic_filter_num != filters.length
    }

    $("#footer").toggleClass("filters", has_filters)

    if (filters.length == 0) filters.push("1=1")

    if (!loading) check_extent = true
    last_filter = id

    filter = filters.join(" AND ")
    db(filter)

    show_loader(true)

    if (last_zoom >= points_level) {
      apply_pins_filters()
      update_clusterer_flag = true
    } else {
      apply_cluster_filter()
      update_pins_flag = true
    }

    map.infoWindow.hide()
    bonus_filters.show(dept)
  }

  var bonus_filters = {
    show: function(dept) {
      sectors.show(dept)
      services.show(dept)
      charges.show(dept)
      $("#bonus_filter_holder").css("display", dept == -1 ? "none" : "block")
    },
    init: function() {
      sectors.init()
      services.init()
      charges.init()
      workspace_types.init()
    },
  }

  sectors = {
    init: function() {
      var out = "<select><option value='-1'>All Sectors</option>"
      for (var x = 0; x < sector_data["Office"].length; x++) {
        out += "<option>" + sector_data["Office"][x] + "</option>"
      }
      out += "</select>"
      $("#sectors")
        .html(out)
        .find("select")
        .change(sectors.update)
    },
    show: function(dept) {
      //$("#sectors .cat").css("display","none");
      //if (dept!=-1)  $("#"+dept+"_sector").css("display","block");
    },
    update: function() {
      sectors.check_colour()
      do_filter("sector")
    },
    check_colour: function() {
      $("#sectors select").toggleClass(
        "highlight",
        $("#sectors select").val() != -1
      )
    },
    undo: function() {
      services.clear()
      charges.clear()
      workspace_types.clear()
      sectors.update()
    },
    clear: function() {
      $("#sectors select").val(-1)
      sectors.check_colour()
    },
  }

  charges = {
    init: function() {
      for (var i in charges_data) {
        var out = "<select><option value='-1'>Any Price</option>"
        for (var x = 0; x < charges_data[i][1].length; x++) {
          out += "<option>" + charges_data[i][1][x] + "</option>"
        }
        out += "</select>"
        $("#" + i + "_charge")
          .html(out)
          .find("select")
          .change(charges.update)
      }
    },
    show: function(dept) {
      $("#charges .cat").css("display", "none")
      if (dept != -1) $("#" + dept + "_charge").css("display", "block")
    },
    update: function() {
      charges.check_colour()
      do_filter("charge")
    },
    check_colour: function() {
      var dept = workspace_type()
      $("#" + dept + "_charge select").toggleClass(
        "highlight",
        $("#" + dept + "_charge select").val() != -1
      )
    },
    undo: function() {
      services.clear()
      sectors.clear()
      workspace_types.clear()
      charges.update()
    },
    clear: function() {
      $("#" + workspace_type() + "_charge select").val(-1)
      charges.check_colour()
    },
  }

  workspace_types = {
    init: function() {
      $("#workspace_types input").change(workspace_types.update)
    },
    update: function() {
      workspace_types.update_visibility()
      do_filter("workspace_type")
    },
    update_visibility: function() {
      var types = []
      $("#workspace_types input:checked").each(function() {
        types.push(
          $(this)
            .parent()
            .find("span")
            .html()
        )
      })
      $("#desk_price").css(
        "display",
        types.length == 1 && types[0] == "Artists" ? "none" : "block"
      )
      $("#space_price").css(
        "display",
        types.length >= 1 && $.inArray("Artists", types) == -1
          ? "none"
          : "block"
      )
    },
    clear: function() {
      $("#workspace_types input").prop("checked", false)
    },
    undo: function() {
      services.clear()
      charges.clear()
      sectors.clear()
      workspace_types.update()
    },
  }

  services = {
    init: function() {
      for (var i in filter_service_data) {
        var out = ""
        for (var x = 0; x < filter_service_data[i].length; x++) {
          out +=
            "<label><input type='checkbox' value='" +
            filter_service_data[i][x] +
            "'> <span>" +
            filter_service_data[i][x] +
            "</span></label>"
        }
        $("#" + i + "_services")
          .html(out)
          .find("input")
          .change(services.update)
      }
    },
    show: function(dept) {
      $("#services .cat").css("display", "none")
      if (dept != -1) $("#" + dept + "_services").css("display", "block")
    },
    update: function() {
      if ($(this).is("input")) {
        services.last_filter = $(this).val()
        $("#filters input[value='" + $(this).val() + "']").prop(
          "checked",
          $(this).prop("checked")
        )
      }
      services.select_all.set_ui()
      do_filter("service")
    },
    last_filter: false,
    select_all: {
      set_ui: function() {
        $("#select_all").toggleClass(
          "selected",
          !$("#" + workspace_type() + "_services input:not(:checked)").length
        )
      },
      go: function(b) {
        if (b === undefined) b = !$("#select_all").hasClass("selected")
        $("#" + workspace_type() + "_services input").prop("checked", b)
        services.update()
      },
    },
    clear: function(keep_last) {
      //$("#services input").prop("checked", false);
      keep_last = !!keep_last
      $("#services input").each(function() {
        $(this).prop(
          "checked",
          keep_last && $(this).val() == services.last_filter
        )
      })
      services.last_filter = false
    },
    undo: function() {
      services.clear(true)
      charges.clear()
      sectors.clear()
      workspace_types.clear()
      services.update()
    },
  }

  go_back_to_map = function() {
    $("body")
      .removeClass("showinfo")
      .addClass("min")
    hash.update("map")
  }

  select_prompt = function() {
    swal(
      "Select an Edit",
      "(From the drop-down box below the checkboxes)",
      "warning"
    )
  }

  clear_filters = function() {
    sectors.clear()
    workspace_types.clear()
    workspace.prices.clear()
    workspace.prices2.clear()
    //charges.clear();
    services.clear()
    services.select_all.go(false)
    workspace_types.update_visibility()
    setTimeout(function() {
      do_filter()
      show_loader(false)
    }, 1) //stop it halting the filters close while thinking
  }

  show_thumb = function(b) {
    did("thumb").style.display = b ? "block" : "none"
  }

  /********** Helper functions **********/

  function create_map() {
    var map = new Map("mapDiv", {
      extent: initial_extent,
      basemap: create_basemaps({
        types: ["plain", "satellite", "buildings", "watercolour"],
        css: { right: "65px !important" },
      }),
      maxZoom: 18,
      logo: false,
      showInfoWindowOnClick: false,
    })
    map.on("zoom-end", map_zoom_end)
    map.on("load", function() {
      do_filter(false, true)

      last_zoom = map.getZoom()
      map_zoom_end(map.getLevel())
      bonus_filters.init()
      $("#big_add").css("display", "block")
      if (window.top != window.self) map.disableScrollWheelZoom()
    })
    map.on("zoom-end", function(e) {
      map.infoWindow.hide()
    })
    return map
  }

  function create_credentials() {
    var credentials = {
      store_as: "esri_jsapi_id_manager_data",
      init: function() {
        credentials.load()
        esriId.on("credential-create", credentials.store)
        esriId.on("dialog-create", credentials.show_login)
        esriId.checkSignInStatus(mapservice).then(function(e) {
          if (e.token) {
            credentials.success()
          } else {
            credentials.show_login()
          }
        })
      },
      show_login: function(b) {
        $("body").toggleClass("login", b !== false)
      },
      load: function() {
        var idJson = cookie(credentials.store_as)
        if (idJson && idJson != "null" && idJson.length > 4) {
          idObject = JSON.parse(idJson)
          esriId.initialize(idObject)
        }
      },
      store: function() {
        if (esriId.credentials.length === 0) {
          return
        }
        var idString = JSON.stringify(esriId.toJson())
        cookie(credentials.store_as, idString)
      },
      attempt: function() {
        var username = $("#uname").val()
        var password = $("#pwd").val()
        if (!username || !password) return

        $("#mylogin .loader").css("display", "block")
        $("#mylogin .content").css("display", "none")
        $(".esriSignInDialog #dijit_form_ValidationTextBox_0").val(username)
        $(".esriSignInDialog #dijit_form_ValidationTextBox_1").val(password)
        $("#dijit_form_Button_0").click()

        var check = setInterval(function() {
          if ($("#dijit_form_Button_0_label").html() == "OK") {
            //Finished asking
            if ($(".esriErrorMsg").css("display") == "none") {
              credentials.success()
            } else {
              swal("Invalid", "Your username or password were invalid", "error")
            }
            $("#mylogin .loader").css("display", "none")
            $("#mylogin .content").css("display", "block")
            clearInterval(check)
          }
        }, 100)
      },
      success: function() {
        cookie("signed_in", 1) //for quick (not required to be secure) checks
        credentials.show_login(false)
        //$("body").css("background", "none");
        //$("#mapDiv").css("display", "block");
        //$("#mylogin").css("display", "none");
        do_home_reset = true
        resize_panel()
      },
    }
    credentials.init()
    return credentials
  }

  function format_title(g) {
    var title = clean_title(g.attributes["site_name"])
    if (workspace_type() == "New") {
      title = (has_val(g.attributes["edit_id"]) ? "Edit" : "New") + ": " + title
    }
    return "<span>" + title + "</span>"
  }

  function create_pins() {
    var locations = new FeatureLayer(mapservice, {
      mode: FeatureLayer.MODE_ONDEMAND,
      id: "pins",
      outFields: ["*"],
      infoTemplate: new InfoTemplate(format_title, getTextContent),
    })
    locations.on("mouse-over", function(e) {
      if (last_hover) {
        if (last_hover.graphic == e.graphic) return
        hover_pin(last_hover, false) //IE sometimes doesn't register mouse-outs
      }
      last_hover = e
      show_thumb(true)
      hover_pin(e, true)
    })
    locations.on("load", fetch_new_workspaces)

    var click_event = is_touch_device() ? "mouse-over" : "mouse-down"
    locations.on(click_event, function(e) {
      show_thumb(false)
      var query = new esri.tasks.Query()
      query.geometry = pointToExtent(map, e.graphic.geometry, 0) //Search 2px around the actual point stored for the school-graphic clicked, to see if another school has a common location (most commonly primary/secondary)
      locations.queryFeatures(query, function(featureSet) {
        map.infoWindow.setFeatures(featureSet.features)
        $(".esriPopup").css("opacity", 0)
        map.infoWindow.anchor = "auto"
        map.infoWindow.show(e.graphic.geometry) //change to e.mapPoint if want to show popup where the click occured
        infoWindow_reposition(e)
      })
      e.stopPropagation()
    })
    locations.on("error", check_network)
    locations.on("mouse-out", function(e) {
      last_hover = false
      show_thumb(false)
      hover_pin(e, false)
    })
    locations.on("mouse-move", function(e) {
      if (last_thumb != e.graphic) {
        last_thumb = e.graphic
        var a = e.graphic.attributes
        var name = a["site_name"]
        if (!name) name = a["address"]

        did("thumb").innerHTML = "<div>" + clean_title(name) + "</div>"
      }

      did("thumb").style.left = 0
      ;(function() {
        //Allows thumb position to be set, to check full 1-line width of text
        var offset = {
          top: e.clientY - 30,
          left: e.clientX + 30,
          width: did("thumb").offsetWidth,
        }
        if (offset.left + offset.width + 10 >= document.body.clientWidth) {
          offset.left = offset.left - offset.width - 60
        }
        if (offset.top < 0) offset.top = 0

        did("thumb").style.left = offset.left + "px"
        did("thumb").style.top = offset.top + "px"
      })()
    })
    locations.on("update-end", function() {
      show_loader(false)
      db(locations.graphics)
      check_for_points()
      check_reset_home()
    })

    locations.setRenderer(new SimpleRenderer(get_pin("Office")))

    return locations
  }

  function setup_hash() {
    var hash = {
      init: function() {
        if (!is_mobile()) return
        window.onhashchange = function() {
          if (!hash.updating) {
            if ($("body").hasClass("showinfo")) {
              go_back_to_map()
            } else if ($("body").hasClass("min")) {
              workspace.minimise(false)
            }
          }
        }
      },
      updating: false,
      update: function(b) {
        if (!is_mobile()) return
        window.location.hash = b
        hash.updating = true
        setTimeout(function() {
          hash.updating = false
        }, 50)
      },
    }
    hash.init()
    return hash
  }

  function create_workspace_controller() {
    var workspace = {
      adding: false,
      init: function() {
        map.on("mouse-move", workspace.prompt.move)
        map.on("mouse-out", workspace.prompt.hide)
        map.on("mouse-over", workspace.prompt.show)
        map.on("pan-start", workspace.prompt.hide)
        map.on("pan-end", function(e) {
          workspace.prompt.do_show = true
          force_clusters_hack(true)
        })

        var map_click_event = is_touch_device() ? "mouse-over" : "click"
        map.on(map_click_event, function(e) {
          workspace.set_location(e)
          if (is_mobile()) map.infoWindow.hide()
        })
        this.pin_layer = new GraphicsLayer({ id: "new_pins" })
        map.addLayer(this.pin_layer)

        var save_to = is_admin
          ? "Workspaces_service_editable_service_01"
          : "Workspaces_service_editable_edits_service_01"

        this.save_edits_layer = new FeatureLayer(
          service_dir + save_to + "/FeatureServer/0"
        )
        this.save_edits_layer.on("edits-complete", workspace.edits_complete)

        this.services = new workspace.checkboxes(
          service_data,
          "services_holder",
          "services_row",
          "_service",
          "Services"
        )
        this.sectors = new workspace.checkboxes(
          sector_data,
          "sector_holder",
          "sectors_catered_for_row",
          "_sector",
          "Sectors Catered For"
        )

        workspace.prices.init()
        workspace.prices2.init()
      },
      prices: {
        timer: false,
        init: function() {
          $("#price_slider").slider({
            value: this.vals.length - 1,
            min: 0,
            max: this.vals.length - 1,
            step: 1,
            slide: function(event, ui) {
              workspace.prices.set(ui.value)
            },
          })
          //workspace.prices.set( $( "#price_slider" ).slider( "value" ) );
        },
        vals: [50, 100, 150, 200, 300, 400, 500, "Any Price"],
        set: function(val) {
          var text
          if (val == workspace.prices.vals.length - 1) {
            text = workspace.prices.vals[val]
          } else {
            text = "Up to £" + workspace.prices.vals[val] + " p/m"
          }
          $("#price_text")
            .html(text)
            .toggleClass("highlight", val != workspace.prices.vals.length - 1)
          $("#price_slider").toggleClass("atZero", val == 0)
          try {
            clearTimeout(workspace.prices.timer)
            workspace.prices.timer = setTimeout(function() {
              do_filter()
            }, 300)
          } catch (err) {} //On load, function doesn't exist yet
        },
        clear: function() {
          var show_all_id = this.vals.length - 1
          this.set(show_all_id)
          $("#price_slider").slider("value", show_all_id)
        },
        get_filter: function() {
          var val = $("#price_slider").slider("value")
          //if (val==0) return "cost_month__exact_ IS NULL";
          if (val == workspace.prices.vals.length - 1) return false
          else {
            return (
              "(site_type='Artist studios' OR cost_month__exact_<=" +
              workspace.prices.vals[val] +
              ")"
            )
          }
        },
      },
      prices2: {
        timer: false,
        init: function() {
          $("#price_slider2").slider({
            value: this.vals.length - 1,
            min: 0,
            max: this.vals.length - 1,
            step: 1,
            slide: function(event, ui) {
              workspace.prices2.set(ui.value)
            },
          })
          //workspace.prices2.set( $( "#price_slider2" ).slider( "value" ) );
        },
        vals: [10, 15, 20, 30, 40, 50, 60, "Any Price"],
        set: function(val) {
          var text
          if (val == workspace.prices2.vals.length - 1) {
            text = workspace.prices2.vals[val]
          } else {
            text = "Up to £" + workspace.prices2.vals[val] + " per square foot"
          }
          $("#price_slider2").toggleClass("atZero", val == 0)
          $("#price_text2")
            .html(text)
            .toggleClass("highlight", val != workspace.prices2.vals.length - 1)
          try {
            clearTimeout(workspace.prices2.timer)
            workspace.prices2.timer = setTimeout(function() {
              do_filter()
            }, 300)
          } catch (err) {} //On load, function doesn't exist yet
        },
        clear: function() {
          var show_all_id = this.vals.length - 1
          this.set(show_all_id)
          $("#price_slider2").slider("value", show_all_id)
        },
        get_filter: function() {
          var val = $("#price_slider2").slider("value")
          //if (val==0) return "cost_of_studios__£_sqft_pa_ IS NULL";
          if (val == workspace.prices2.vals.length - 1) return false
          else {
            return (
              "(site_type<>'Artist studios' OR cost_of_studios__£_sqft_pa_<=" +
              workspace.prices2.vals[val] +
              ")"
            )
          }
        },
      },
      toggle: function() {
        this.adding = !this.adding
        map.infoWindow.hide()
        if (!this.adding) {
          this.pin_layer.clear()
          workspace.graphic = false
          workspace.verify.pin_moved = false
          workspace.editing = false
          $("body")
            .removeClass("placed_pin")
            .removeClass("placing_pin")
            .removeClass("verifying")
            .removeClass("editing")
        } else {
          $("body")
            .addClass("placing_pin")
            .removeClass("min")
          if (!this.data) this.fetch_field_data()
          workspace.clear_all_vals()
        }
        workspace.lock = false
        resize_panel()
        locations.setVisibility(!this.adding && last_zoom >= points_level)
        clusterLayer.setVisibility(!this.adding && last_zoom < points_level)
      },
      lock: false,
      save: function() {
        if (workspace.lock || !this.validate()) return

        workspace.verify.get_user(function(user_det) {
          workspace.lock = true
          var graphicAttributes = workspace.get_input_values()
          if (is_admin) {
            graphicAttributes.verified = 1
          } else {
            graphicAttributes.verified = 0
          }
          graphicAttributes.contact_email = user_det.join(
            workspace.verify.user_splitter
          )

          workspace.graphic.setAttributes(graphicAttributes)
          show_big_loader(true)
          workspace.save_edits_layer
            .applyEdits([workspace.graphic], null, null)
            .then(function(result) {
              show_loader(false)
              if (result[0].success) {
                workspace.close()
                var message = is_admin
                  ? "This workspace is now live to all users. Thank you"
                  : "Your submission will be verified & made visible to all users in the next 2 weeks. Thank you."
                swal("Saved", message, "success")
                if (!is_admin) {
                  graphicAttributes["site_name"]
                    doorbell.send("A new workspace has been added called '"+graphicAttributes["site_name"]+"'.", user_det[1]);
                  updateRSS(
                    "A new workspace has been added called '" +
                      graphicAttributes["site_name"] +
                      "'.",
                    user_det[1]
                  )
                }
              } else {
                workspace.error()
              }
              workspace.lock = false
            }, workspace.edits_failed)
        })
      },
      validate: function() {
        for (var i in required_fields) {
          var val = this.get_input_val(required_fields[i])
          if (!val) {
            workspace.validation_error(
              $("#" + required_fields[i] + "_row span").html(),
              "This is required data. You must make an entry here before you can submit this Workspace.",
              required_fields[i]
            )
            return false
          }
        }
        for (var i in fields_require_ints) {
          var val = this.get_input_val(fields_require_ints[i])
          if (isNaN(val)) {
            workspace.validation_error(
              $("#" + fields_require_ints[i] + "_row span").html(),
              "This entry must be an integer number.",
              fields_require_ints[i]
            )
            return false
          }
        }
        for (var i in fields_require_website) {
          var val = this.get_input_val(fields_require_website[i])
          if (val) {
            if (!workspace.valid_url(val)) {
              var extra =
                val.indexOf("http") !== 0 ? "  It must start with http://" : ""
              workspace.validation_error(
                $("#" + fields_require_website[i] + "_row span").html(),
                "This entry must be a full website URL." + extra,
                fields_require_website[i]
              )
              return false
            }
          }
        }
        for (var i in fields_require_email) {
          var val = this.get_input_val(fields_require_email[i])
          if (val) {
            if (!workspace.valid_email(val)) {
              workspace.validation_error(
                $("#" + fields_require_email[i] + "_row span").html(),
                "This entry must be a valid email address.",
                fields_require_email[i]
              )
              return false
            }
          }
        }
        return true
      },
      valid_url: function(value) {
        return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(
          value
        )
      },
      valid_email: function(email) {
        var emailReg = new RegExp(
          /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i
        )
        return emailReg.test(email)
      },
      validation_error: function(title, text, field) {
        swal(
          {
            title: title,
            text: text,
            type: "error",
          },
          function() {
            workspace.focus_row(field)
          }
        )
      },
      focus_row: function(name) {
        $("#" + name + "_row :nth-child(2)").focus()
      },
      remove: function() {
        if (workspace.lock) return
        workspace.lock = true
        show_big_loader(true)

        var oid = workspace.graphic.attributes.objectid

        var to_delete = this.get_edit_graphics(oid, function(oids) {
          oids.push(workspace.graphic)
          try {
            for (var i in oids)
              workspace.remove_list_item(oids[i].attributes.objectid)
          } catch (err) {}
          workspace.save_edits_layer
            .applyEdits(null, null, oids)
            .then(null, workspace.edits_failed)
        })
      },
      get_edit_graphics: function(oid, foo) {
        var query = new esri.tasks.Query()
        query.where = "edit_id=" + oid
        query.outFields = ["objectid"]
        new esri.tasks.QueryTask(mapservice).execute(query, function(
          featureSet
        ) {
          var to_delete = []
          for (var i in featureSet.features) {
            var g = new Graphic(
              featureSet.features[i].geometry,
              get_pin("Office")
            )
            g.setAttributes(featureSet.features[i].attributes)
            to_delete.push(g)
          }
          foo(to_delete)
        })
      },
      remove_list_item: function(oid) {
        $("#objlink_" + oid).remove()
        update_new_count()
      },
      close: function() {
        workspace.toggle()
        $("#fields input").val("")
        $("body")
          .removeClass("verifying")
          .removeClass("placed_pin")
        resize_panel()
      },
      get_input_values: function() {
        var graphicAttributes = {} // x: workspace.graphic.geometry.x, y: workspace.graphic.geometry.y };
        $("#fields > div").each(function() {
          var column_name = $(this).attr("id")
          if (column_name) {
            column_name = column_name.replace("_row", "")
            var val = workspace.get_input_val(column_name)
            db(val)
            graphicAttributes[column_name] = val
          }
        })
        return graphicAttributes
      },
      get_input_val: function(name) {
        //TODO: Automaticaly get sector/service value from here.
        var val
        if (name == "services") return workspace.services.get()
        if (name == "sectors_catered_for") return workspace.sectors.get()
        name = "#" + name + "_row"
        if ($(name).find("input").length == 0) {
          val = $(name)
            .find("select")
            .val()
        } else {
          val = $(name)
            .find("input")
            .val()
        }
        if (!val || val == -1) val = null
        else val = html_encode(val)
        return val
      },
      fetch_field_data: function(foo) {
        var requestHandle = esriRequest({
          url: mapservice,
          content: {
            f: "json",
          },
          callbackParamName: "callback",
        })
        requestHandle.then(function(e) {
          workspace.build_field_data(e)
          if (foo) foo()
        })
      },
      build_field_data: function(e) {
        workspace.data = e.fields
        e.fields.push({ name: "geometry", alias: "Location" })
        var out = "",
          admin_out = ""
        for (var x = 0; x < e.fields.length; x++) {
          if ($.inArray(e.fields[x].name, ignore_fields) == -1) {
            var extra_info = info_buttons[e.fields[x].name]
            var info = !extra_info
              ? ""
              : '<div class="help" title="' +
                extra_info +
                '" onclick="workspace.field_help(\'' +
                extra_info +
                "')\"></div>"
            var is_admin_data =
              $.inArray(e.fields[x].name, admin_only_fields) != -1
            out +=
              "<div id='" +
              e.fields[x].name +
              "_row'" +
              (is_admin_data ? " class='admindata'" : "") +
              "><span>" +
              e.fields[x].alias.titlefy() +
              info +
              "</span><input type='text'><div class='prompter'></div></div>"
          }
        }

        $("#new_point #fields").html(out)

        for (var x = fields_order.length - 1; x >= 0; x--) {
          $("#" + fields_order[x] + "_row").prependTo("#fields")
        }
        for (var x = 0; x < admin_only_fields.length; x++) {
          $("#" + admin_only_fields[x] + "_row").appendTo("#fields")
        }

        $("#new_point #fields").append(
          "<div onclick='workspace.show_admin_data()' class='admindataprompt'>Click to view Admin-Only Data</div>"
        )

        for (var i in field_dropdowns) {
          var select = "",
            val,
            text
          for (var x in field_dropdowns[i]) {
            if ($.isArray(field_dropdowns[i][x])) {
              val = field_dropdowns[i][x][0]
              text = field_dropdowns[i][x][1]
            } else {
              val = text = field_dropdowns[i][x]
            }
            select += "<option value='" + val + "'>" + text + "</option>"
          }
          var extra =
            i == "site_type" ? " onclick='workspace.change_type(true)'" : ""
          $("#" + i + "_row input").replaceWith(
            "<select" + extra + ">" + select + "</select>"
          )
        }
        workspace.change_type()
        resize_panel()
      },
      show_admin_data: function() {
        $("#fields").addClass("showadmin")
      },
      change_type: function(go) {
        if (go) return true //Added 291216, because the actual services are the same for each type now, so no longer needs to be reset
        workspace.services.build()
        workspace.sectors.build()
      },
      checkboxes: function(
        data,
        holder_id,
        main_holder,
        checkbox_suffix,
        title
      ) {
        return {
          build: function() {
            var classes = $("#" + main_holder).attr("class")
            $("#" + main_holder).remove()
            var out =
              "<div id='" +
              main_holder +
              "'><span>" +
              title +
              "</span><div id='" +
              holder_id +
              "' class='box'><var onclick='select_prompt()'></var>"
            var type = get_category($("#site_type_row > select").val())
            for (var i in data[type]) {
              out +=
                "<label><input id='" +
                this.short_name(data[type][i]) +
                checkbox_suffix +
                "' type='checkbox'><em>" +
                data[type][i] +
                "</em></label>"
            }
            out += "</div><div class='prompter'></div></div>"
            $("#new_point #fields .admindata:first").before(out)
            $("#" + main_holder).attr("class", classes)
          },
          get: function(as_array) {
            var out = []
            $("#" + holder_id + " input:checked").each(function() {
              //out.push( $(this).attr("id").replace(checkbox_suffix,"") );
              out.push(
                $(this)
                  .parent()
                  .find("em")
                  .html()
              )
            })
            out = this.to_nice_array(out)
            return as_array ? out : out.join(",")
          },
          has_changed: function() {
            var old_data = $("#" + holder_id).attr("data-original-value")
            old_data = old_data ? old_data.split(/,\s*/) : []
            var new_data = this.get(true)
            db(old_data, new_data)
            return (
              new_data.toString().toLowerCase() !==
              old_data.toString().toLowerCase()
            )
          },
          to_nice_array: function(arr) {
            return arr.sort(function(a, b) {
              return a.toLowerCase().localeCompare(b.toLowerCase())
            })
          },
          set: function(val) {
            //if (!has_val(val)) return;
            if (!has_val(val)) val = ""
            var vals = this.to_nice_array(val.split(/,\s*/))

            $("#" + holder_id + " input").prop("checked", false)
            $("#" + holder_id).attr("data-original-value", vals.join(","))

            for (var x = 0; x < vals.length; x++) {
              var skip = function() {
                vals.splice(x, 1)
                x--
              }
              vals[x] = this.short_name(vals[x])
              try {
                var checkbox = $("#" + vals[x] + checkbox_suffix)
                if (checkbox.length != 0) {
                  checkbox.prop("checked", true)
                } else {
                  skip()
                }
              } catch (err) {
                skip()
              }
            }
          },
          short_name: function(n) {
            return n
              .trim()
              .toLowerCase()
              .replace(/&/g, "and")
              .replace(/ /gi, "_")
              .replace(/[^\w\s]|_/g, "")
          },
        }
      },
      set_location: function(e) {
        if (!workspace.adding || workspace.editing) return
        workspace.place_pin(e.mapPoint)
        workspace.prompt.hide()
        $("body")
          .addClass("placed_pin")
          .removeClass("placing_pin")
        workspace.show_data()
      },
      place_pin: function(point, a) {
        if (!workspace.graphic) {
          workspace.pin_layer.clear()
          a = a || {}
          workspace.graphic = new Graphic(point, get_pin("Office"))
          workspace.graphic.setAttributes(a)
          workspace.pin_layer.add(workspace.graphic)
        } else {
          workspace.verify.pin_moved = true
          workspace.graphic.setGeometry(point)
        }
      },
      edit: function(objectid, not_new) {
        workspace.adding = true
        if (not_new) workspace.editing = true
        map.infoWindow.hide()
        $("body")
          .addClass("placed_pin")
          .addClass("verifying")
          .removeClass("min")
          .removeClass("showinfo")
        $("#verify_button").html(
          workspace_type() == "New" ? "Verify" : "Submit"
        )
        if (is_minimised) minimise(false)
        var next = function() {
          workspace.show_edit_vals(objectid, function(graphic) {
            var action = function() {
              $("body")
                .addClass("placed_pin")
                .addClass("verifying")
                .removeClass("min")
              locations.setVisibility(false)
              clusterLayer.setVisibility(false)
              workspace.show_data()
              workspace.place_pin(graphic.geometry, graphic.attributes)
              map.centerAndZoom(graphic.geometry)
            }

            if (not_new) {
              graphic.attributes.geometry = graphic.geometry
              workspace.fetch_edits(objectid, graphic.attributes, action)
            } else {
              action()
            }
          })
        }
        if (!this.data) {
          workspace.fetch_field_data(next)
        } else {
          next()
        }
      },
      fetch_edits: function(oid, old_vals, foo) {
        var query = new esri.tasks.Query()
        query.where = "edit_id=" + oid
        query.outFields = ["*"]
        query.returnGeometry = true

        var geometries = [old_vals.geometry]
        old_vals.geometry = "g0" //gives index of geometries array (with a g so doesn't register as !has_val()

        $("#edit_prompt span").html(old_vals.site_name)

        new esri.tasks.QueryTask(mapservice).execute(
          query,
          function(featureSet) {
            var fields = {}
            var edit_oids = []

            for (var i in featureSet.features) {
              var g = featureSet.features[i]
              if (g.attributes["objectid"]) edit_oids.push(g)

              if (!same_location(geometries[0], g.geometry)) {
                g.attributes.geometry = "g" + geometries.length
                geometries.push(g.geometry)
              }

              for (var x in g.attributes) {
                var val = g.attributes[x]
                if ($.inArray(x, ["objectid", "edit_id", "verified"]) == -1) {
                  if (x == "site_name") {
                    if (val == old_vals[x]) {
                      val = false
                    } else {
                      val = clean_title(val, true)
                    }
                  }
                  if (val || val === 0) {
                    if (!fields[x]) fields[x] = []
                    fields[x].push(val)
                  }
                }
              }
            }

            workspace.verify.current_edit_oids = edit_oids

            $("body")
              .addClass("editing")
              .removeClass("min")
            $("#fields > div").addClass("hide")
            for (var i in fields) {
              $("#" + i + "_row").removeClass("hide")

              var dropdown = [[-1, "--- Pick an Edit ---"]]

              var is_checkbox = i == "sectors_catered_for" || i == "services"
              var val,
                num = 1

              for (var x in fields[i]) {
                if (i == "site_type") {
                  val = get_category(fields[i][x])
                } else if (i == "geometry") {
                  val = "Edited Location " + num++
                } else {
                  val = fields[i][x]
                }

                if (!val || val == -1) {
                  val = "[Removed by User]"
                  fields[i][x] = ""
                }
                if (is_checkbox) val = val.replace(/\,/g, ", ")
                db((fields[i][x] + "").addslashes())
                dropdown.push([(fields[i][x] + "").addslashes(), val])
              }

              if (!has_val(old_vals[i])) {
                dropdown.push(["", "[Ignore Edits]"])
              } else {
                var old_val =
                  i == "site_type" ? get_category(old_vals[i]) : old_vals[i]
                old_val = (old_val + "").replace(/[^\x00-\x7F]/g, "") //found a case where &#8203; snuck in, hidden & ruined email address validation
                dropdown.push([old_val, "[Ignore Edits]"])
              }

              var selectbox = $("<select></select>").on("change", function() {
                if ($(this).val() != -1) {
                  i = $(this)
                    .parent()
                    .parent()
                    .attr("id")
                    .replace("_row", "")
                  if (i == "sectors_catered_for") {
                    workspace.sectors.set($(this).val())
                  } else if (i == "services") {
                    workspace.services.set($(this).val())
                  } else if (i == "geometry") {
                    var geom =
                      geometries[
                        $(this)
                          .val()
                          .slice(-1)
                      ]
                    workspace.place_pin(geom)
                    map.centerAndZoom(geom)
                  } else {
                    var type = field_dropdowns[i] ? "select" : "input"
                    $(this)
                      .parent()
                      .parent()
                      .find(type)
                      .val($(this).val())
                  }
                }
                $(this).toggleClass("valid", $(this).val() != -1)
              })

              for (var z in dropdown) {
                selectbox.append(
                  '<option value="' +
                    dropdown[z][0] +
                    '">' +
                    dropdown[z][1] +
                    "</option>"
                )
              }

              var current_value = has_val(old_vals[i])
                ? old_vals[i]
                : "<i>None</i>"

              var show_original = is_checkbox
                ? ""
                : "<div>Original Value: " + current_value + "</div>"
              $("#" + i + "_row > div.prompter")
                .html(show_original)
                .append(selectbox)
            }

            foo()
          },
          function(e) {
            setTimeout(function() {
              workspace.fetch_edits(oid, old_vals, foo)
            }, 100)
          }
        )
      },
      verify: {
        pin_moved: false,
        go: function() {
          if (workspace.lock || !workspace.validate()) return
          workspace.lock = true
          if (is_admin) workspace.verify.admin()
          else workspace.verify.user()
        },
        edits: function() {
          if (workspace.lock || !workspace.validate()) return
          workspace.lock = true
          var success = true
          $("#fields > div > div > select:visible").each(function() {
            if ($(this).val() == -1) {
              success = false
              return false //exit loop
            }
          })
          if (success) {
            workspace.verify.admin(function() {
              show_big_loader(true)
              workspace.remove_list_item(
                workspace.graphic.attributes["objectid"]
              )
            }, workspace.verify.current_edit_oids)
          } else {
            swal(
              "Check all Edits",
              "You have not yet selected from the drop-downs whether to accept some of the edits",
              "warning"
            )
            workspace.lock = false
          }
        },
        current_edit_oids: [],
        admin: function(foo, extra_deletes) {
          swal(
            {
              title: "Going Live",
              text: "Are you sure you want to put this live to all users?",
              showCancelButton: true,
            },
            function(b) {
              if (b) {
                if (foo) foo()
                extra_deletes = extra_deletes || []
                for (var i in workspace.graphic.attributes) {
                  workspace.graphic.attributes[i] =
                    workspace.graphic.attributes[i] || 0
                }
                var a = workspace.get_input_values()
                for (var i in a) workspace.graphic.attributes[i] = a[i]
                workspace.graphic.attributes.verified = 1
                show_big_loader(true)

                workspace.save_edits_layer.applyEdits(
                  null,
                  [workspace.graphic],
                  extra_deletes,
                  null,
                  function(e) {
                    workspace.edits_failed(e)
                    setTimeout(function() {
                      workspace.verify.admin(extra_deletes)
                    }, 100)
                  }
                )
              } else {
                workspace.lock = false
              }
            }
          )
        },
        user: function() {
          var differences = workspace.verify.changes()
          db(differences)
          if (differences.length == 0 && !workspace.verify.pin_moved) {
            workspace.toggle()
            swal("No changes", "You did not make any changes.")
          } else {
            workspace.verify.get_user(function(user_det) {
              var a = {}
              for (var i in differences) {
                var val = workspace.get_input_val(differences[i])
                if (!val) val = -1
                a[differences[i]] = val
              }
              a.edit_id = workspace.graphic.attributes.objectid
              a.contact_email = user_det.join(workspace.verify.user_splitter)

              var old_name = workspace.graphic.attributes.site_name
              a.site_name = a.site_name
                ? old_name + "@@@" + a.site_name
                : old_name

              a.verified = 0

              var g = new Graphic(workspace.graphic.geometry, get_pin("Office"))
              g.setAttributes(a)

              show_big_loader(true)
              workspace.save_edits_layer
                .applyEdits([g], null, null)
                .then(function(result) {
                  show_loader(false)
                  if (result[0].success) {
                    workspace.close()
                    var message =
                      "Your edit will be verified & made visible to all users within 2 weeks. Thank you."
                    swal("Saved", message, "success")
					doorbell.send("The workspace '"+old_name+"' has been edited.", user_det[1]);
                    updateRSS(
                      "The workspace '" + old_name + "' has been edited.",
                      user_det[1]
                    )
                  } else {
                    workspace.error()
                  }
                  workspace.lock = false
                }, workspace.edits_failed)
            })
          }
        },
        user_det: false,
        user_splitter: " *** ", //to show what in the contact_email field splits the various user info
        get_user: function(foo) {
          if (workspace.verify.user_det) return foo(user_det)
          else if (is_admin) return foo(["ADMIN"])
          swal(
            {
              title: is_mobile() ? "" : "And for our records...",
              text: $("#contact_form").html(),
              confirmButtonText: "Submit",
              showCancelButton: true,
              cancelButtonText: "Back",
              closeOnConfirm: false,
            },
            function(b) {
              if (b) {
                var contact = []
                var i = 0
                $(".sweet-alert #fields > div")
                  .find("input,select")
                  .each(function(i) {
                    if (i == 1 && !workspace.valid_email($(this).val())) {
                      alert("Please enter in a valid email address.")
                      return false
                    } else if (i != 2 && !has_val($(this).val())) {
                      //contact number can be blank
                      alert("Please fill out all required fields.")
                      return false
                    } else {
                      contact.push($(this).val())
                    }
                  })
                if (contact.length == 4) {
                  workspace.verify.user_det = contact
                  swal.close()
                  foo(contact)
                }
              }
            }
          )
          $(".sweet-alert.showSweetAlert input")
            .get(0)
            .focus()

          //Tab-index for some reason broken in "And for our records..." popup. This fixes it.
          $(".sweet-alert #fields > div").each(function() {
            var next_index = $(this).index() + 2
            $(this)
              .find("input")
              .on("blur", function() {
                $("#fields > div:nth-child(" + next_index + ")")
                  .find("input, select")
                  .focus()
              })
          })
        },
        changes: function() {
          var changed_columns = []

          var all = workspace.get_input_values()

          for (var i in all) {
            if (i == "services") {
              if (workspace.services.has_changed()) changed_columns.push(i)
            } else if (i == "sectors_catered_for") {
              if (workspace.sectors.has_changed()) changed_columns.push(i)
            } else if (all[i] != workspace.graphic.attributes[i]) {
              var word = workspace.graphic.attributes[i]
              if (word === "0") word = 0 //annoying js quirk, only in an IF statement "0" is true
              var no_changed_zero = !(
                (!word || word == -1) &&
                (!all[i] || all[i] == -1)
              ) //i.e. has changed from one form of no val to another (i.e. legacy rows have random zeros in!)
              if (
                no_changed_zero &&
                (!all[i] || !word || (all[i] + "").trim() != (word + "").trim())
              ) {
                changed_columns.push(i)
              }
            }
          }
          return changed_columns
        },
      },
      minimise: function(b) {
        if (b !== false) b = true
        if (!is_mobile() && b) return
        $("body").toggleClass("min", b)
        hash.update(b ? "map" : "")
      },
      field_help: function(info) {
        swal("", info, "info")
      },
      edits_complete: function(result) {
        show_loader(false)
        var is_update = result.updates[0] && result.updates[0].success
        var is_delete = result.deletes[0] && result.deletes[0].success
        if (is_update || is_delete) {
          workspace.close()
          locations.refresh()
          var message, title, oid
          if (is_update) {
            var type = workspace_type() == "New" ? "verified" : "edited"
            oid = result.updates[0].objectId
            title = "Saved"
            message =
              "You have " +
              type +
              " this Workspace.<br>It is now live to all users. Well done!"
          } else {
            title = "Deleted"
            message = "You have successfully deleted this Workspace."
            oid = result.deletes[0].objectId
            db(
              "HI LUCIENNE! THE OUTPUT BELOW IS WHAT YOU CARE ABOUT. Please expand it (if there is a little plus sign, expand everything), then either take a screenshot, or copy & paste, and send it to me (David.Beaton@london.gov.uk). Thanks!"
            )
            db(result)
          }
          workspace.remove_list_item(oid)
          swal(title, message, "success")
        } else {
          workspace.error()
        }
        workspace.lock = false
      },
      edits_failed: function(e) {
        show_loader(false)
        if (check_network()) {
          workspace.error()
        }
        workspace.lock = false
      },
      clear_all_vals: function() {
        $("#fields input").val("")
        $("#fields input").prop("checked", false)
        $("#fields select").each(function() {
          $(this)[0].selectedIndex = 0
        })
        workspace.change_type()
      },
      show_edit_vals: function(objectid, foo) {
        workspace.clear_all_vals()
        apply_pins_filters()

        var query = new esri.tasks.Query()
        query.objectIds = [objectid]
        query.outFields = ["*"]
        query.returnGeometry = true

        new esri.tasks.QueryTask(mapservice).execute(
          query,
          function(featureSet) {
            if (featureSet.features[0]) {
              for (var i in featureSet.features[0].attributes) {
                var val = featureSet.features[0].attributes[i]
                if (!val || val == 0) val = ""
                var type = field_dropdowns[i] ? "select" : "input"
                $("#" + i + "_row " + type)
                  .val(val)
                  .attr(
                    "data-original-value",
                    $("#" + i + "_row " + type).val()
                  )
              }
              workspace.change_type()
              db(featureSet.features[0].attributes)
              workspace.services.set(featureSet.features[0].attributes.services)
              workspace.sectors.set(
                featureSet.features[0].attributes.sectors_catered_for
              )
              foo(featureSet.features[0])
            }
          },
          function() {
            setTimeout(function() {
              workspace.show_edit_vals(objectid, foo)
            }, 100)
          }
        )
      },
      show_data: function() {
        try {
          $("#fields")
            .find("input[type=text],select")
            .filter(":visible:first")
            .get(0)
            .focus()
        } catch (err) {}
        resize_panel()
      },
      prompt: {
        selector: "#thumbdrop",
        hide: function() {
          workspace.prompt.set_visibility(false)
        },
        show: function() {
          workspace.prompt.set_visibility(true)
        },
        set_visibility: function(b) {
          if ((!workspace.adding || workspace.editing) && b) return
          $(workspace.prompt.selector).css("display", b ? "block" : "none")
        },
        move: function(e) {
          if (!workspace.adding || workspace.editing) return
          if (workspace.prompt.do_show) {
            workspace.prompt.show()
            workspace.prompt.do_show = false
          }
          var distance = 30
          var offset = {
            top: e.clientY - 2,
            left: e.clientX,
            width: $(workspace.prompt.selector).outerWidth(),
          }
          if (
            offset.left + offset.width + distance >=
            document.body.clientWidth
          ) {
            offset.left = offset.left - offset.width - distance
          } else {
            offset.left += distance
          }
          if (offset.top < 0) offset.top = 0
          $(workspace.prompt.selector)
            .css("left", offset.left)
            .css("top", offset.top)
        },
      },
      error: function() {
        swal(
          "Error",
          "There was a problem saving your entry. Please try again later",
          "error"
        )
      },
      remove_prompt: function() {
        swal(
          {
            title: "Delete this Workspace?",
            text:
              "You will not be able to undo this. Are you sure you want to delete this Workspace?",
            type: "warning",
            showCancelButton: true,
          },
          function(b) {
            if (b) workspace.remove()
          }
        )
      },
      logout: function() {
        var cookies = document.cookie.split(";")
        for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i]
          var eqPos = cookie.indexOf("=")
          var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT"
        }
        location.reload()
      },
    }
    workspace.init()
    return workspace
  }

  function thumb_position(e, set_orientation) {
    var offset = {
      top: e.clientY - 30,
      left: e.clientX + 50,
      width: $("#thumb").width(),
    }
    if (set_orientation) {
      thumb_orientated_left =
        offset.left + offset.width + 20 >= document.body.clientWidth
    }
    if (thumb_orientated_left) {
      offset.left = offset.left - offset.width - 125
    }
    if (offset.top < 0) offset.top = 0
    did("thumb").style.left = offset.left + "px"
    did("thumb").style.top = offset.top + "px"
  }

  function infoWindow_reposition(e) {
    var pos = $(".esriPopupWrapper").offset()
    pos.width = $(".esriPopupWrapper").width()
    pos.height = $(".esriPopupWrapper").height()
    var doc = { width: $(document).width(), height: $(document).height() }

    var over_right = pos.left + pos.width > doc.width
    var under_top = pos.top < 0
    var over_bottom = pos.top + pos.height > doc.height
    var under_left = pos.left < 0

    var g = map.toScreen(e.graphic.geometry)

    var anchor

    if (under_top) {
      if (over_right || doc.width - g.x < pos.width) {
        anchor = "bottom_left"
      } else if (under_left || g.x < pos.width) {
        anchor = "bottom_right"
      } else {
        anchor = "bottom"
      }
    } else if (over_right) {
      if (over_bottom || g.y < pos.height) {
        anchor = "top_left"
      } else {
        anchor = "left"
      }
    } else if (over_bottom) {
      if (under_left || g.x < pos.width) {
        anchor = "top_right"
      } else {
        anchor = "top"
      }
    } else if (under_left) {
      if (doc.height - g.y < pos.height) {
        anchor = "auto"
      } else {
        anchor = "right"
      }
    }
    if (anchor) {
      map.infoWindow.anchor = anchor
      map.infoWindow.show(e.graphic.geometry)
    }
    $(".esriPopup").css("opacity", 1)
  }

  function check_reset_home() {
    if (do_home_reset) {
      setTimeout(function() {
        do_home_reset = false
      }, 350)
      map.setExtent(initial_extent)
    }
  }

  function hover_pin(e, hover) {
    engorge_pin(e, false) //Do this always in case it's first time (transition from css not set is funky)
    if (hover) {
      move_to_front(e.graphic)
      engorge_pin(e, true)
    }
  }

  function move_to_front(g) {
    var shape = g.getDojoShape()
    if (shape) shape.moveToFront()
  }

  function engorge_pin(e, bigger) {
    if (isIE) {
      e.graphic.setSymbol(
        get_pin(get_category(e.graphic.attributes.site_type), bigger)
      )
    } else {
      if (bigger) {
        $(e.target).css("transformOrigin") //Just accessing this property somehow allows it to work properly!
        $(e.target).attr("class", "animate")

        var transform = $(e.target).attr("transform")
        var matrix = transform
          .substring(7, transform.indexOf(")", 7))
          .split(",")

        matrix[4] = matrix[4] * 1 - 5
        matrix[5] = matrix[5] * 1 - 10

        matrix = "matrix(" + matrix.join(",") + ") scale(1.5)"
        $(e.target).css({ transform: matrix })
      } else {
        $(e.target).css({ transform: $(e.target).attr("transform") })
      }
    }
  }

  function map_zoom_end(e) {
    var level = e.level || e
    if (!clusterLayer) clusterer()
    if (!workspace.adding) {
      if (level >= points_level && last_zoom < points_level) {
        clusterLayer.setVisibility(false)
        locations.setVisibility(true)
      } else if (level < points_level && last_zoom >= points_level) {
        clusterLayer.setVisibility(true)
        locations.setVisibility(false)
      }
    }
    last_zoom = level
    //check_for_undone_filters();
    force_clusters_hack()
  }

  function force_clusters_hack(pan) {
    setTimeout(function() {
      apply_cluster_filter()
      if (!pan && last_zoom >= points_level) apply_pins_filters()
    }, 1)
  }

  function resize_panel() {
    var h =
      $("#panel #content").height() -
      ($("#panel").offset().top + $("#panel").height() - $(window).height()) -
      (is_mobile() ? 0 : 25)
    $("#panel #content").css((is_mobile() ? "" : "max-") + "height", h)
  }

  function is_mobile() {
    return $("body").width() <= 600
  }

  function is_touch_device() {
    return (
      "ontouchstart" in window || navigator.maxTouchPoints // works on most browsers
    ) // works on IE10/11 and Surface
  }

  function pad_extent_by_panel(e) {
    var doc_width = $(document).width()
    var panel_percent_shift =
      doc_width > 1400 ? 35 : doc_width < 500 ? 0.01 : 50
    var panel = screenUtils.toMapGeometry(
      e,
      doc_width,
      $(document).height(),
      new esri.geometry.Extent(
        $("#panel").position().left,
        $("#panel").position().top,
        $("#panel").position().left + $("#panel").width(),
        $("#panel").position().top + $("#panel").height(),
        e.spatialReference
      )
    )
    var x_pad = (panel.xmin - panel.xmax) / (100 / panel_percent_shift)
    return e.offset(x_pad, 0)
  }

  function once_only(name) {
    if (typeof Storage === "undefined" || localStorage.getItem(name))
      return false
    store(name, 1)
    return true
  }

  function check_for_auto_show_about_popup() {
    if (!is_admin && once_only("auto_about_popup")) {
      about_map()
    }
  }

  function html_encode(value) {
    return $("<div/>")
      .text(value)
      .html()
  }

  function clusterer(filter) {
    if (clusterLayer) {
      map.removeLayer(clusterLayer)
    }

    var show_all = filter == "1=1"

    if (show_all && all_points_clusterer) {
      clusterLayer = all_points_clusterer
    } else {
      var sls = SimpleLineSymbol
      var sms = SimpleMarkerSymbol

      var one = new sms(
        "circle",
        5,
        new sls(sls.STYLE_SOLID, new Color([0, 0, 0, 0.25]), 15),
        new Color([0, 196, 19, 1])
      )
      var small = new sms(
        "circle",
        20,
        new sls(sls.STYLE_SOLID, new Color([0, 74, 127, 0.25]), 15),
        new Color([0, 74, 127, 0.7])
      )
      var medium = new sms(
        "circle",
        30,
        new sls(sls.STYLE_SOLID, new Color([148, 0, 211, 0.25]), 15),
        new Color([148, 0, 211, 0.7])
      )
      var large = new sms(
        "circle",
        38,
        new sls(sls.STYLE_SOLID, new Color([210, 0, 0, 0.25]), 15),
        new Color([210, 0, 0, 0.7])
      )

      var ops = {
        url: mapservice,
        distance: 80,
        id: "clusters",
        labelColor: "#fff",
        outFields: ["objectid"],
        showSingles: false,
        resolution: map.extent.getWidth() / map.width,
        singleSymbol: one,
        singleTemplate: false,
        useDefaultSymbol: false,
      }
      if (filter) ops.where = filter

      clusterLayer = new ClusterFeatureLayer(ops)
      if (last_zoom >= points_level || workspace.adding) {
        clusterLayer.setVisibility(false)
      } else {
        show_loader(true)
        locations.setVisibility(false)
      }

      clusterLayer.on("clusters-shown", function() {
        if (clusterLayer.visible) {
          check_for_points()
          show_loader(false)
          check_reset_home()
        }
      })

      if (show_all) all_points_clusterer = clusterLayer

      var renderer = new ClassBreaksRenderer(null, "clusterCount")

      renderer.addBreak(0, 9, small)
      renderer.addBreak(9, 50, medium)
      renderer.addBreak(50, 10000, large)

      clusterLayer.setRenderer(renderer)
    }

    map.addLayer(clusterLayer)
  }

  function symbol(color, size) {
    var icon =
      "M502.054,217.876C502.054,97.531,404.501,0,284.168,0C165.532,0,69.207,94.894,66.535,212.902 c-0.082-0.039-0.178-0.039-0.251-0.039c-0.052,1.067,0.117,2.143,0.091,3.218c-0.009,0.594-0.091,1.197-0.091,1.795 c0,2.165,0.269,4.255,0.33,6.393c2.451,141.576,162.473,290.959,217.556,344.134C438.86,442.987,483.89,326.654,496.901,264.623c0.478-2.177,0.894-4.341,1.293-6.519c1.258-6.679,2.125-12.669,2.732-17.8c0-0.065,0.017-0.125,0.017-0.187 C502.565,225.779,502.054,217.876,502.054,217.876L502.054,217.876z"
    var markerSymbol = new esri.symbol.SimpleMarkerSymbol()
    markerSymbol.setPath(icon)
    markerSymbol.setColor(Color.fromHex(color))
    markerSymbol.setOutline(
      new SimpleLineSymbol(
        SimpleLineSymbol.STYLE_SOLID,
        new Color([0, 0, 0]),
        isLteIE8 ? 1 : 8
      )
    )
    markerSymbol.setSize(size)
    markerSymbol.setOffset(0, size / 2)
    return markerSymbol
  }

  function clean_title(name, part) {
    part = part ? 1 : 0
    name = name || ""
    if (name.indexOf("@@@") != -1) name = name.split("@@@")[part]
    return name.stripslashes()
  }

  function fetch_new_workspaces(e) {
    var query = new esri.tasks.Query()
    query.where = "verified=0"
    query.outFields = ["objectid", "site_name", "edit_id"]
    var edits_already_output = {}
    new esri.tasks.QueryTask(mapservice).execute(query, function(featureSet) {
      var new_out = "",
        edit_out = ""
      for (var i in featureSet.features) {
        var a = featureSet.features[i].attributes
        if (a["edit_id"]) {
          if (!edits_already_output[a["edit_id"]]) {
            edits_already_output[a["edit_id"]] = true
            edit_out +=
              "<div id='objlink_" +
              a.edit_id +
              "' onclick='workspace.edit(" +
              a.edit_id +
              ", true)'>" +
              clean_title(a.site_name) +
              "</div>"
          }
        } else {
          new_out +=
            "<div id='objlink_" +
            a.objectid +
            "' onclick='workspace.edit(" +
            a.objectid +
            ")'>" +
            a.site_name +
            "</div>"
        }
      }
      $("#new_points").html(new_out)
      $("#edited_points").html(edit_out)
      update_new_count()
    })
  }

  function update_new_count(v) {
    var new_points = $("#new_points > div").length
    var edited_points = $("#edited_points > div").length
    var num = new_points + edited_points

    $("#new_count").html(num == 0 ? "" : "(" + num + ")")

    $("#new_points_subtitle").css("display", new_points == 0 ? "none" : "block")
    $("#edited_points_subtitle").css(
      "display",
      edited_points == 0 ? "none" : "block"
    )
    $("#no_points_warning").css("display", num == 0 ? "block" : "none")
  }

  var no_points_found = false

  function ask_undo_filters() {
    /*if (no_points_found) {
			no_points_found = false;
			return clear_filters();
		}*/
    if (workspace_type() == "New") return
    if (last_filter) {
      var undo_filter_action
      if (last_filter == "service") {
        undo_filter_action = services.undo
      } else if (last_filter == "sector") {
        undo_filter_action = sectors.undo
      } else if (last_filter == "charge") {
        undo_filter_action = charges.undo
      } else if (last_filter == "workspace_type") {
        undo_filter_action = workspace_types.undo
      } else {
        undo_filter_action = function() {
          var filters = ["type"]
          for (var x = 0; x < filters.length; x++) {
            var f = "filter_" + filters[x]
            if (f != last_filter) {
              did(f).value = -1
            }
          }
          do_filter(false)
        }
      }
      try {
        no_points_found = true
        swal(
          {
            title: "No Results!",
            text: "Would you like to undo your previous filters?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Undo Filters",
            closeOnConfirm: true,
          },
          undo_filter_action
        )
      } catch (err) {
        //Something in the library isn't supported
        if (
          confirm("No Results! Would you like to undo your previous filters?")
        )
          undo_filter_action()
      }
    }
    show_loader(false)
  }

  function workspace_type() {
    return $("input:radio[name='workspace_type']:checked").val() == "New"
      ? "New"
      : "Office"
  }

  function getTextContent(graphic) {
    var a = graphic.attributes
    db(graphic)
    var out = infoclickdisplay(a)

    if (is_mobile()) {
      $("#back_to_map #title").html(format_title(graphic))
      $("#back_to_map #content").html(out)
      $("body").addClass("showinfo")
      return ""
    } else {
      $(".esriPopup").toggleClass("long_name", a["site_name"].length > 24)
      $(".esriPopup .titlePane").css("background", "#9E0059")
      return out
    }
  }

  function infoclickdisplay(a) {
    var out = $("#popup_content_template").html()

    var check = function(code, field, is_raw) {
      var val = is_raw ? field : a[field]
      var valid = has_val(val)
      if (valid) {
        out = out.replace("$" + code + "$", val)
      } else {
        var p = $("<div></div>").html(out)
        p.find("." + code + "_holder").remove()
        out = p.html()
      }
      return valid
    }

    check("TYPE", "site_type")

    check("YEAR", "year_established__site_")
    check("DESKS", "number_of_desks__studios__workb")

    if (!has_val(a["provision_type"])) a["provision_type"] = "Desks"
    check("DESKTYPE", "provision_type")

    var cost2 = a["cost_of_studios__£_sqft_pa_"]
    if (cost2) cost2 = "£" + cost2 + " per square foot"
    check("FOOTAGE", cost2, true)

    var cost = a["cost_month__exact_"]
    if (cost) cost = "£" + cost + " per month (" + a["cost_month_type"] + ")"
    else if (!cost2) cost = "Price on Inquiry" //i.e. no costs at all associated with this workspace
    check("COST", cost, true)

    /*var sectors = a["sectors_catered_for"];
		if (sectors) sectors = sectors.replace(/\,/g, ", ");
		check("SECTORS", sectors, true);*/

    if (
      has_val(a["post_code"]) &&
      has_val(a["address"]) &&
      a["address"].slice(-1) != ","
    )
      a["address"] += ","
    check("ADDRESS", "address")

    if (has_val(a["address"]) && a["address"].indexOf(a["post_code"]) != -1)
      a["post_code"] = ""
    check("POSTCODE", "post_code")

    var phone = a["site_telephone"]
    if (has_val(phone)) phone = "<a href='tel:" + phone + "'>" + phone + "</a>"
    var has_contact = check("PHONE", phone, true)

    has_contact =
      check("EMAIL", "generic_email__space_enquiries_") || has_contact

    a["website"] = urlify(a["website"])
    has_contact = check("WEBSITE", "website") || has_contact

    setTimeout(function() {
      $(".contact").css("display", has_contact ? "block" : "none")
    }, 1)

    a["facebook"] = urlify(a["facebook"])
    check("FACEBOOK", "facebook")

    a["twitter"] = urlify(a["twitter"])
    check("TWITTER", "twitter")

    var services = ""
    if (has_val(a["services"])) {
      var thisservices = a["services"].split(",")
      for (i in thisservices) {
        var val = thisservices[i].trim()
        if (
          val.length > 3 &&
          has_val(val) &&
          $.inArray(val, extra_service_data) == -1
        ) {
          services +=
            "<div><img src='images/icons/" +
            val
              .toLowerCase()
              .replace(/ /gi, "_")
              .replace("/", "") +
            ".gif' title='" +
            val +
            " available'><span>" +
            val.titlefy() +
            "</span></div> "
        }
      }
      setTimeout(function() {
        $(".SERVICES_holder")
          .find("img")
          .click(function() {
            swal(
              "",
              $(this)
                .attr("title")
                .titlefy(),
              "info"
            )
          })
      }, 1)
    }
    check("SERVICES", services, true)

    var button_extra = !a["facebook"] && !a["twitter"] ? ";margin-top:-7px" : ""
    var action = a["edit_id"]
      ? "workspace.edit(" + a["edit_id"] + ", true)"
      : "workspace.edit(" + a["objectid"] + ")"
    var text = a["verified"] ? "Suggest an Edit" : "Start Verifying"
    var unbuttonify_css = is_admin
      ? ""
      : "padding:20px 0 0;background:transparent;color:#9e0059;"
    out +=
      "<div class='button' onclick='" +
      action +
      "' style='" +
      unbuttonify_css +
      "margin-bottom:-5px" +
      button_extra +
      "'>" +
      text +
      "</div>"

    return out
  }

  function get_category(cat) {
    switch (cat) {
      case "Co-working":
        return "Office"
      case "Artist studios":
        return "Artist"
      case "Makerspace":
        return "Maker"
      case "Accelerator":
        return "Accelerator"
      case "Incubator":
        return "Incubator"
      case "Kitchen":
        return "Kitchen"
    }
  }

  function get_site_type(cat) {
    switch (cat) {
      case "Office":
        return "Co-working"
      case "Artist":
        return "Artist studios"
      case "Maker":
        return "Makerspace"
      case "Accelerator":
        return "Accelerator"
      case "Incubator":
        return "Incubator"
      case "Kitchen":
        return "Kitchen"
    }
  }

  function has_val(val) {
    return (
      $.inArray(val, [
        "",
        false,
        "Null",
        "null",
        "<Null>",
        "na",
        "NA",
        "#N/A",
        "n/a",
        "N/A",
        "Supp",
        "#VALUE!",
        0,
        "0",
        undefined,
        null,
      ]) == -1
    )
  }

  function urlify(val) {
    if (has_val(val) && val.indexOf("//") == -1) val = "http://" + val
    return val
  }

  function check_search_highlight() {
    if (highlight_search) {
      for (var x = 0; x < locations.graphics.length; x++) {
        if (locations.graphics[x].attributes["objectid"] == highlight_search) {
          locations.graphics[x].setSymbol(symbol("#FF00F2", 40))
          move_to_front(locations.graphics[x])
          setTimeout(function() {
            locations.graphics[x].setSymbol(
              get_pin(get_category(locations.graphics[x].attributes.site_type))
            )
          }, 2000)
          highlight_search = false
          return
        }
      }
    }
  }

  function goto_bounding_box() {
    var queryTask = new esri.tasks.QueryTask(mapservice)
    var query = new esri.tasks.Query()
    query.where = filter
    queryTask.executeForExtent(query, function(result) {
      if (result.count == 0) {
        ask_undo_filters()
      } else {
        var extent = result.extent.expand(1.1)
        if (extent) map.setExtent(extent, true)
      }
    })
  }

  function pointToExtent(map, point, toleranceInPixel) {
    var pixelWidth = map.extent.getWidth() / map.width
    var toleranceInMapCoords = toleranceInPixel * pixelWidth
    return new esri.geometry.Extent(
      point.x - toleranceInMapCoords,
      point.y - toleranceInMapCoords,
      point.x + toleranceInMapCoords,
      point.y + toleranceInMapCoords,
      map.spatialReference
    )
  }

  function same_location(g1, g2) {
    return g1.x == g2.x && g1.y == g2.y
  }

  function check_network() {
    if (!connection_exists()) {
      swal(
        "No Internet Connection",
        "Please reconnect and try again.",
        "warning"
      ) //Can't do connection icon, because there's no connection to download it!
      show_loader(false)
      return false
    }
    return true
  }

  function connection_exists() {
    var xhr = new XMLHttpRequest()
    var file = "https://maps.london.gov.uk/utils/connection-test/blank.gif"
    var randomNum = Math.round(Math.random() * 10000)
    xhr.open("HEAD", file + "?rand=" + randomNum, false)
    try {
      xhr.send()
      return xhr.status >= 200 && xhr.status < 304
    } catch (e) {
      return false
    }
  }

  function check_for_undone_filters() {
    //Don't reset clusters etc with the latest filter unless the zoom level requires it. When it does, apply then.
    if (last_zoom >= points_level) {
      if (update_pins_flag) apply_pins_filters()
    } else {
      if (update_clusterer_flag) apply_cluster_filter()
    }
  }

  function get_pin(type, hover) {
    var size = hover ? 30 : 20
    var colour = colours[type]
    return symbol(colour, size)
  }

  function check_for_points(b) {
    if (check_extent) {
      check_extent = false
      if (!points_visible()) {
        goto_bounding_box()
      }
    }
    check_search_highlight()
  }

  function points_visible() {
    //Are there points displayed on screen?
    var check = locations.visible ? locations : clusterLayer
    if (check.graphics.length == 0) return false
    for (var x = 0; x < check.graphics.length; x++) {
      if (map.extent.contains(check.graphics[x].geometry)) return true
    }
    return false
  }

  function getvar(name, url) {
    if (!url) url = window.location.href
    name = name.replace(/[\[\]]/g, "\\$&")
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ""
    return decodeURIComponent(results[2].replace(/\+/g, " "))
  }

  function show_big_loader(b) {
    $("body").toggleClass("bigloading", b)
  }

  function show_loader(b) {
    $("body").toggleClass("loading", b)
    if (!b) show_big_loader(false)
  }

  function apply_pins_filters() {
    //update_pins_flag = false;
    db("SETTING locations expression to: " + filter)
    locations.setDefinitionExpression(filter)
  }

  function apply_cluster_filter() {
    //update_clusterer_flag = false;
    clusterer(filter)
  }

  function westminster() {
    return new esri.geometry.Extent(
      -24224,
      6702709,
      -681,
      6720385,
      new esri.SpatialReference({ wkid: 3857 })
    )
  }

  function zoomed_out_central_london() {
    return new esri.geometry.Extent(
      -41309,
      6692991,
      22897,
      6728152,
      new esri.SpatialReference({ wkid: 3857 })
    )
  }

  function get_dropdown_val(id) {
    var elem = did(id)
    return elem.value || elem.options[elem.selectedIndex].text //for ie
  }

  function unique(array) {
    return $.grep(array, function(el, index) {
      return index === $.inArray(el, array)
    })
  }

  function get_var(name, url) {
    if (!url) url = window.location.href
    name = name.replace(/[\[\]]/g, "\\$&")
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ""
    return decodeURIComponent(results[2].replace(/\+/g, " "))
  }

  function did(id) {
    return document.getElementById(id)
  }

  function db() {
    //Debug to the console
    try {
      var stack = new Error().stack
        .replace(/^[^\(]+?[\n$]/gm, "")
        .replace(/^\s+at\s+/gm, "")
        .split("\n")
      stack =
        stack[1].split(":")[2] +
        " (" +
        stack[1].substring(0, stack[1].indexOf("(") - 1) +
        ")"
      console.log(" ") //new line
      if (arguments.length == 0) {
        console.log(stack)
      } else {
        console.log.call(
          console,
          stack,
          arguments.length == 1 ? arguments[0] : arguments
        )
      }
    } catch (err) {}
  }
})

String.prototype.titlefy = function() {
  return this.replace(/\_/g, " ").replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}
String.prototype.addslashes = function() {
  //no need to do (str+'') anymore because 'this' can only be a string
  return this.replace(/[\\"']/g, "\\$&").replace(/\u0000/g, "\\0")
}
String.prototype.stripslashes = function() {
  return this.replace(/\\(.)/gm, "$1")
}

$(function() {
  if (!is_admin) $(".admin").remove()
  $("#type_options")
    .buttonset()
    .on("change", function() {
      workspace.prices.clear()
      workspace.prices2.clear()
      do_filter()
    })
    .css("visibility", "visible")

  //Handle case where no mailto client is set
  $("a[href^=mailto]").each(function() {
    var href = $(this).attr("href")
    $(this).click(function() {
      var t
      $(window).blur(function() {
        clearTimeout(t)
      })
      t = setTimeout(function() {
        swal({
          title: "Copy This",
          text: "You can paste the following link into an email:",
          type: "input",
          inputValue:
            "London's Open Workspaces: https://maps.london.gov.uk/workspaces/",
        })
        $(".sweet-alert input[type=text]").select()
        document.execCommand("copy")
      }, 500)
    })
  })

  if (is_admin) {
    //$("body").addClass("admin");
    $("#main_logo").attr("href", "admin")
  }
})

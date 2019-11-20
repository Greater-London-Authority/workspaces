// SWEETALERT
// http://t4t5.github.io/sweetalert/

/**
 * [SweetAlert description]
 * @param {string} title The title of the modal. It can either be added to the object under the key "title" or passed as the first parameter of the function.
 * @param {string} text  A description for the modal. It can either be added to the object under the key "text" or passed as the second parameter of the function.
 * @param {string} type  The type of the modal. SweetAlert comes with 4 built-in types which will show a corresponding icon animation: "warning", "error", "success" and "info". You can also set it as "input" to get a prompt modal. It can either be put in the object under the key "type" or passed as the third parameter of the function.
 */
function SweetAlert(title, text, type){

	var title = (title != null) ? title : 'About this map';
	var text = (text != null) ? text : 'About this map';
	var type = (type != null) ? type : 'info';
	var html = (html != null) ? html : false;

	/**
	 * SweetAlert Modal Title
	 * @return {String} property
	 */
	this.getTitle = function(){return title}

	/**
	 * SweetAlert Modal Text
	 * @return {String} property
	 */
	this.getText = function(){return text}

	/**
	 * SweetAlert Modal Type
	 * @return {String} property
	 */
	this.getType = function(){return type}

	/**
	 * SweetAlert Modal Type
	 * @return {Boolean} property
	 */
	this.getHTML = function(){return html}

	/**
	 * SweetAlert Modal Title
	 */
	this.setTitle = function(set_title){title = set_title}

	/**
	 * SweetAlert Modal Text
	 */
	this.setText = function(set_text){text = set_text}

	/**
	 * SweetAlert Modal Type
	 */
	this.setType = function(set_type){type = set_type}

	/**
	 * SweetAlert Modal html
	 */
	this.setHTML = function(set_html){html = set_html}


	/**
	 * Feed the sweetalert some text to show as info
	 * @param  {String} [desc="insert description here"] [description]
	 */
	this.about_map = function() {
		swal({title:this.getTitle(),  text:this.getText(), type:this.getType(), html:this.getHTML()});
	}

	/**
	 * Show the about map sweetalert on first load
	 */
	this.check_for_auto_show_about_popup = function() {
		if(typeof(Storage) !== "undefined" && !localStorage.getItem("about_popup_force_first_time")) {
			localStorage.setItem("about_popup_force_first_time", 1);
			this.about_map();
		}
	}


}

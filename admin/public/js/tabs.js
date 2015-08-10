$(function() {
	var waitingCount = 0;
	var headingSelector = "h3.form-heading, .toolbar-container";
	
	var waitForHeadings = window.setInterval(function() {
		var headings = $(headingSelector);
		
		waitingCount++;
		
		if(waitingCount > 200) {
			window.clearInterval(waitForHeadings);
			return;
		}
		
		if (headings.length < 2) return;
		
		window.clearInterval(waitForHeadings);
		
		var form = headings.parent('form');
		var content = $('<div class="tab-content"></div>');
		
		var contents = [];
		
		headings.each(function(i, h) {
			var $h = $(h);
			var text = h.textContent.replace(' ', '-').replace('"', '-');
			var id = ("tabId" + text);
			
			$h.attr("href", "#" + id);
			
			var groupWith = $h.nextUntil(headingSelector);
			
			var tabPane = $('<div id="' + id + '" class="tab-pane"></div>');
			groupWith.each(function(i, g) {
				$(g).appendTo(tabPane);
			});
			
			contents.push(tabPane);
			
		});
		headings.click(function(e) {
			headings.removeClass("active");
			$(this).tab("show").addClass("active");
		});
		
		contents.forEach(function(t) {
			t.appendTo(content);
		});
		content.appendTo(form);
				
		headings.first().tab("show").addClass("active");
		
		form.addClass("tabs"); //we can use this to control styling for any list items that don't have tabs, won't have this class
	}, 25);
});
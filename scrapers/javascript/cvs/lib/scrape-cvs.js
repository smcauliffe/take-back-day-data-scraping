var scrapeCVS = {
	src: 'cvs',
	url: 'http://www.cvssavingscentral.com/storelocator/SaferCommunities.aspx',
	parms: {},
	collection: [],
	addresses: {},

	toHTML: async function (http, parms) {
		
		try {

			var raw = await http(this.url, {params: parms, responseType: 'html'});

			var text = raw.data.replace(/\s{2,}/g, '');
		
			var regex = /<table class="address_table".+?<\/table>/;

			var html = text.match(regex)[0];

			return html;

		} catch (e) {
			console.log(e);
		}

	},

	toDOM: function (dom, html) {
		
		var $dom = dom(html);

		$dom('tr').eq(0).remove();

		return $dom;

	},

	toJSON: function ($dom, zip, model) {

		var src = this.src,
		collection = this.collection,
		addresses = this.addresses,
		types = {
			'college': 'School',
			'duane,reade,walgreens,pharmacy,cvs,rx,drug': 'Pharmacy',
			'army,guard,naval,ft.': 'Military',
			'hospital,va': 'Hospital',
			'medicine': 'Doctor\'s Office',
			'ecopark': 'Recycling Center',
			'police,sheriff,safety,precinct': 'Police',
			'county,town,municipal,village': 'Government'
		};

		$dom('tr').each( (i, tr) => {
			
			$children = $dom(tr).children();
			
			var m, 
				name = $children.eq(0).text(), 
			address = $children.eq(1).text(), 
				city = $children.eq(2).text(),
			zip = $children.eq(4).text(),
				type = 'Unknown',
				searching = true;
			
			if ($children.eq(3).text() === 'NY' &&
						!addresses[address]) {

				addresses[address] = 1;

					var haystack = name.toLowerCase();

					for (var l in types) {

						var ts = l.split(',');

						if (!searching) { break; }

						for (var t = 0; t < ts.length; t++) {

							var needle = ts[t];

							if (haystack.indexOf(needle) > -1) {
								type = types[l];
								searching = false;
								break;
							}
						}
					}

				m = {
					'Location': name,
					'Street Address': address,
					'City': city,
					'Zip': zip,
					'Latitude': 'required',
					'Longitude': 'required',
					'Type': type
				}
				
				var errors = model.validate(m);
				
				if (errors.length) {
					throw new Error(errors);
				}
				
				collection.push(m);
			}
			
		});
		
		return this;
		
	},

	toCollection: function () {

		var collection = this.collection,
			src = this.src;

		return new Promise (function (resolve, reject) {
			resolve({collection: collection});
		});

	},

	toFile: function (fs, r) {

		var src = this.src;
		var data = r.collection;

		// write to file ../data/cvs.json
		fs.writeFile(`./data/${src}.json`, JSON.stringify(data), function(err) {
    	if(err) {
    	    return console.log(err);
    	}

    	console.log("The file was saved!");
		}); 
	}
}

module.exports = scrapeCVS;

module.exports = [
	{
		'to': 'geometry.coordinates',
		'from': ['Longitude', 'Latitude'],
		'type': 'LngLat',
		'options': {
			'filters': ['notZero']
		}
	},
	{
		'to': 'properties.val',
		'from': 'Value',
		'type': 'Number',
		'options': {
			'filters': ['gte:1', 'lte:25000']
		}
	},
	{
		'to': 'properties.datetime',
		'from': 'Captured Time',
		'type': 'Date',
		'options': {
			'filters': ['notFuture']
		}
	},
	{
		'to': 'incrementor',
		'type': 'Date',
		'from': 'Uploaded Time',
	}
];
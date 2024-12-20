( () => {
	magic.app = Object.assign( magic.app, {
		runDir : nw.__dirname,
		...nw.App,
		Window : {
			...nw.Window
		},
		window : nw.Window.get()
	} );
} )();
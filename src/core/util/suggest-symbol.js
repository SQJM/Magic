const expressions = {
	'<' : {
		cn : '左值',
		en : 'left value'
	},
	'>' : {
		cn : '右值',
		en : 'right value'
	},
	'!' : {
		cn : '没有',
		en : 'nothing'
	},
	'#' : {
		cn : '类型',
		en : 'type'
	},
	'&' : {
		cn : '和',
		en : 'and'
	},
	'@' : {
		cn : '要求',
		en : 'requirement'
	},
	'*' : {
		cn : '期待',
		en : 'expectation'
	},
	'[*^]' : {
		cn : '里面',
		en : 'inside'
	},
	'[!?]' : {
		cn : '不存在',
		en : 'nonexistent'
	},
	'[!=]' : {
		cn : '不一样',
		en : 'different'
	},
	'[!@]' : {
		cn : '不符合要求',
		en : 'do not meet the requirements'
	},
	'[^@]' : {
		cn : '实际上',
		en : 'actual'
	},
	'[^#]' : {
		cn : '结果',
		en : 'result'
	},
	'[@*]' : {
		cn : '配置',
		en : 'config'
	},
	'[#=]' : {
		cn : '文件',
		en : 'file'
	},
	'[#+]' : {
		cn : '目录',
		en : 'directory'
	},
	'[%&]' : {
		cn : '路径',
		en : 'path'
	},
	'[%%]' : {
		cn : '错误',
		en : 'error'
	},
	'[&&]' : {
		cn : '正确',
		en : 'correct'
	},
	'[&-]' : {
		cn : '项',
		en : 'item'
	},
	'[%-]' : {
		cn : '索引',
		en : 'indexes'
	}
};// 桀桀桀 - SQJM不语,只是一味的敲代码

const langList = [
	"cn",
	"en"
];

let useLang = "cn";

export const _$ = ( str ) => {
	const parts = str.split( / +/ ).filter( part => part );
	let result = '';

	for ( const part of parts ) {
		if ( expressions[ part ] ) {
			result += expressions[ part ][ useLang ] + ' ';
		} else {
			throw `Unknown expression: ${ part }`;
		}
	}

	return `${ result.trim() }`;
};

export const language = ( lang ) => {
	if ( langList.includes( lang ) ) {
		useLang = lang;
	}
}
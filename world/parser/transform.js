var config = require('./config.js');
var find = require('./utils.js').find;
var fs = require('fs');
var sharp = require('sharp');

module.exports = [
    
    world => {
        
        var convertMetrics = parent => {
                    
            parent.children.forEach( (child, i) => {
                
                if( !child.attrs.x ) child.attrs.x = 0;
                if( !child.attrs.y ) child.attrs.y = 0;
                
                if( !child.attrs.width ) child.attrs.width = 0;
                
                child.attrs.z = i;
                
                child.attrs.x = parent.attrs.x + (child.attrs.x / 100) * parent.attrs.width;
                child.attrs.y = parent.attrs.y + (child.attrs.y / 100) * parent.attrs.height
                
                child.attrs.width = (child.attrs.width / 100) * parent.attrs.width;
                
                if( child.attrs.height !== undefined ) {
                    child.attrs.height = (child.attrs.height / 100) * parent.attrs.height;
                } else {
                    child.attrs.height = child.attrs.width;
                }
                
                convertMetrics( child );
                
            });
        
        };
        
        find( world, 'Region' ).forEach( (region, i) => {
            
            region.attrs.width = region.attrs.height = config.TILE_SIZE;
            
            region.attrs.x = (i % config.WORLD_SIZE) * config.TILE_SIZE;
            region.attrs.y = Math.floor( i / config.WORLD_SIZE ) * config.TILE_SIZE;
            
            convertMetrics( region );
            
        })
        
    },
    
    world => {
        
        var imgs = [];
        
        find( world, 'Image' ).forEach( image => {
            
            var src = image.attrs.src;
            
            var parts = src.split('.');
            var filename = parts[0];
            var extension = parts[1];
            
            src = config.ASSET_PATH + src;
            
            var width = Math.round( image.attrs.width );
            var height = Math.round( image.attrs.height );
            
            var srcs = [];
            
            var destRoot = config.ASSET_PATH + config.RESIZED_DIR;
            
            for( var i = 1; i <= config.ZOOM_LEVELS; i++ ) {
                
                var dest = destRoot + [ filename, width, height ].join('_') + '.' + extension;
                
                if( !imgs.find( img => img.dest === dest ) ) imgs.push({ width, height, src, dest });
                
                srcs.push( dest );
                
                width = Math.round( width / 2 );
                height = Math.round( height / 2 );
                
                if( !width || !height ) break;
                
            }
            
            image.attrs.src = srcs;
            
        })
        
        imgs.forEach( def => {
            
            // sharp(def.src)
            //     .resize(def.width, def.height)
            //     .toFile(def.dest, err => {
                    
            //         if (!err) console.log( 'Resized ' + def.dest );
                    
            //     });
            
        })
        
    }
    
];
    
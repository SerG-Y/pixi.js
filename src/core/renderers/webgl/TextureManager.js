var GLTexture = require('pixi-gl-core').GLTexture,
    CONST = require('../../const'),
	utils = require('../../utils');

/**
 * Helper class to create a webGL Texture
 *
 * @class
 * @memberof PIXI
 * @param gl {WebGLRenderingContext}
 */

var TextureManager = function(renderer)
{
    this.renderer = renderer;
	this.gl = renderer.gl;

	// track textures in the renderer so we can no longer listen to them on destruction.
	this._managedTextures = [];

}

TextureManager.prototype.bindTexture = function(texture)
{

}


TextureManager.prototype.getTexture = function(texture)
{

}

/**
 * Updates and/or Creates a WebGL texture for the renderer's context.
 *
 * @param texture {PIXI.BaseTexture|PIXI.Texture} the texture to update
 */
TextureManager.prototype.updateTexture = function(texture)
{
	texture = texture.baseTexture || texture;

	if (!texture.hasLoaded)
    {
        return;
    }

    
    var glTexture = texture._glTextures[this.renderer.CONTEXT_UID];

    if (!glTexture)
    {
        glTexture = new GLTexture(this.gl);
        glTexture.premultiplyAlpha = true;
        texture._glTextures[this.renderer.CONTEXT_UID] = glTexture;

        texture.on('update', this.updateTexture, this);
        texture.on('dispose', this.destroyTexture, this);
        
        this._managedTextures.push(texture);

        //TODO check is power of two..
        glTexture.enableWrapClamp();

        if(texture.scaleMode === CONST.SCALE_MODES.NEAREST)
        {
            glTexture.enableNearestScaling();
        }
        else
        {
            glTexture.enableLinearScaling();
        }
    }

    glTexture.upload(texture.source);
    
    

    return  glTexture;
}

/**
 * Deletes the texture from WebGL
 *
 * @param texture {PIXI.BaseTexture|PIXI.Texture} the texture to destroy
 */
TextureManager.prototype.destroyTexture = function(texture, _skipRemove)
{
	texture = texture.baseTexture || texture;

    if (!texture.hasLoaded)
    {
        return;
    }

    if (texture._glTextures[this.renderer.CONTEXT_UID])
    {
        texture._glTextures[this.renderer.CONTEXT_UID].destroy();
        texture.off('update', this.updateTexture, this);
        texture.off('dispose', this.destroyTexture, this);


        delete texture._glTextures[this.renderer.CONTEXT_UID];

        if (!_skipRemove)
        {
            var i = this._managedTextures.indexOf(texture);
            if (i !== -1) {
                utils.removeItems(this._managedTextures, i, 1);
            }
        }
    }
}

TextureManager.prototype.removeAll = function()
{
	// empty all the old gl textures as they are useless now
    for (var i = 0; i < this._managedTextures.length; ++i)
    {
        var texture = this._managedTextures[i];
        if (texture._glTextures[this.renderer.CONTEXT_UID])
        {
            delete texture._glTextures[this.renderer.CONTEXT_UID];
        }
    }
}

TextureManager.prototype.destroy = function()
{
    // destroy managed textures
    for (var i = 0; i < this._managedTextures.length; ++i)
    {
        var texture = this._managedTextures[i];
        this.destroyTexture(texture, true);
        texture.off('update', this.updateTexture, this);
        texture.off('dispose', this.destroyTexture, this);
    }

    this._managedTextures = null;
}

module.exports = TextureManager;


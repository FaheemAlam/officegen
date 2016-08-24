var path = require('path');
var fast_image_size = require('fast-image-size');

module.exports = {

  // assume passed in an array of row objects
  getTable: function(rows, tblOpts, gen_private) {
    var tblOpts = tblOpts || {};

    this.gen_private = gen_private;

    var self = this;

    return self._getBase(
        rows.map(function(row) {
          return self._getRow(
              row.map(function(cell) {
                return self._getCell((cell.val || cell), cell.opts, tblOpts);
              }),
              tblOpts
          );
        }),
        self._getColSpecs(rows, tblOpts),
        tblOpts
    )
  },

  _getBase: function (rowSpecs, colSpecs, opts) {
    var self = this;
    var borders =  {};
    if(opts.borders) {
      borders = {
        "w:top": { "@w:val":"single", "@w:sz":opts.borderSize, "@w:space":"0", "@w:color": opts.borderColor },
        "w:start": { "@w:val":"single", "@w:sz":opts.borderSize, "@w:space":"0", "@w:color": opts.borderColor },
        "w:bottom": { "@w:val":"single", "@w:sz":opts.borderSize, "@w:space":"0", "@w:color":opts.borderColor} ,
        "w:end": { "@w:val":"single", "@w:sz":opts.borderSize, "@w:space":"0", "@w:color": opts.borderColor },
        "w:insideH": { "@w:val":"single", "@w:sz":opts.borderSize, "@w:space":"0", "@w:color": opts.borderColor },
        "w:insideV": { "@w:val":"single", "@w:sz":opts.borderSize, "@w:space":"0", "@w:color": opts.borderColor },
      }
    }

    return {
      "w:tbl": {
        "w:tblPr": {
          "w:tblStyle": {
            "@w:val": "a3"
          },
          "w:tblW": {
            "@w:w": "0",
            "@w:type": "auto"
          },
          "w:tblLook": {
            "@w:val": "04A0",
            "@w:firstRow": "1",
            "@w:lastRow": "0",
            "@w:firstColumn": "1",
            "@w:lastColumn": "0",
            "@w:noHBand": "0",
            "@w:noVBand": "1"
          },
          "w:tblBorders":borders
        },
        "w:tblGrid": {
          "#list": colSpecs
        },
        "#list": [rowSpecs]
      }
    }
  },

  _getColSpecs: function(cols, opts) {
    var self = this;
    return cols[0].map(function(val,idx) {
      return self._tblGrid(opts);
    })
  },

  // TODO 
  _tblGrid: function(opts) {
    return {
      "w:gridCol": {
        "@w:w": opts.tableColWidth || "0"
      }
    };
  },


  _getRow: function (cells, opts) {
    return {
      "w:tr": {
        "@w:rsidR": "00995B51",
        "@w:rsidTr": "007F1D13",
        "#list": [cells] // populate this with an array of table cell objects
      }
    }
  },

  _getCell: function (val, opts, tblOpts) {
    opts = opts || {};
    // var b = {};
    var content =[{"w:p": {
      "@w:rsidR": "00995B51",
      "@w:rsidRPr": "00722E63",
      "@w:rsidRDefault": "00995B51",
      "w:pPr": {
        "w:jc": {
          "@w:val": opts.align || tblOpts.tableAlign || "center"
        },
      },
      "w:r": {
        "@w:rsidRPr": "00722E63",
        "w:rPr": {
          "w:rFonts": {
            "@w:ascii": opts.fontFamily || tblOpts.tableFontFamily || "宋体",
            "@w:hAnsi": opts.fontFamily || tblOpts.tableFontFamily || "宋体"
          },
          "w:color": {
            "@w:val": opts.color || tblOpts.tableColor || "000"
          },
          "w:b": {},
          "w:sz": {
            "@w:val": opts.sz || tblOpts.sz || "24"
          },
          "w:szCs": {
            "@w:val": opts.sz || tblOpts.sz || "24"
          }
        },
        "w:t": val
      }
    }}]
    if(typeof val != 'string' && typeof val != 'number') {
      if (Array.isArray(val)) {
        content = this._getComplexCell(val, tblOpts);
      }
    } else {
      if (!opts.b) {
        delete content[0]["w:p"]["w:r"]["w:rPr"]["w:b"];
      }
    }
    var cellObj = {
      "w:tc": {
        "w:tcPr": {
          "w:tcW": {
            "@w:w": opts.cellColWidth || tblOpts.tableColWidth || "0",
            "@w:type": "dxa"
          },
          "w:shd": {
            "@w:val": "clear",
            "@w:color": "auto",
            "@w:fill":  opts.shd && opts.shd.fill || "",
            "@w:themeFill": opts.shd && opts.shd.themeFill || "",
            "@w:themeFillTint": opts.shd && opts.shd.themeFillTint || ""
          }
        },
        "#list": [content]

      }
    }
    return cellObj;
  },
  _getComplexCell: function (cellVal, tblOpts) {
    var _this = this;
    var content = cellVal.map(function(cell) {
      /*
       * TODO: add more options. like adding tables , pictures etc
       */
      var rowObject = [];
      if(cell.type === 'text' || cell.type === 'number') {
        var opts = cell.opts || {};

        if(cell.inline) {
          cell.values.forEach(function(row) {
            var tempRow = {
              "w:r": {
                "@w:rsidRPr": "00722E63",
                "w:rPr": {
                  "w:rFonts": {
                    "@w:ascii": row.opts.fontFamily || tblOpts.tableFontFamily || "宋体",
                    "@w:hAnsi": row.opts.fontFamily || tblOpts.tableFontFamily || "宋体"
                  },
                  "w:color": {
                    "@w:val": row.opts.color || tblOpts.tableColor || "000"
                  },
                  "w:b": {},
                  "w:sz": {
                    "@w:val": row.opts.sz || tblOpts.sz || "16"
                  },
                  "w:szCs": {
                    "@w:val": row.opts.sz || tblOpts.sz || "16"
                  }
                },
                "w:t": row.val
              }
            }
            if(!row.opts.b) {
              delete tempRow["w:r"]["w:rPr"]["w:b"];
            }
            rowObject.push( tempRow);
          })
        } else {
          tempRow =  {
            "w:r": {
              "@w:rsidRPr": "00722E63",
              "w:rPr": {
                "w:rFonts": {
                  "@w:ascii": opts.fontFamily || tblOpts.tableFontFamily || "宋体",
                  "@w:hAnsi": opts.fontFamily || tblOpts.tableFontFamily || "宋体"
                },
                "w:color": {
                  "@w:val": opts.color || tblOpts.tableColor || "000"
                },
                "w:b": {},
                "w:sz": {
                  "@w:val": opts.sz || tblOpts.sz || "16"
                },
                "w:szCs": {
                  "@w:val": opts.sz || tblOpts.sz || "16"
                }
              },
              "w:t": cell.val
            }
          }
          if(!opts.b) {
            delete tempRow["w:r"]["w:rPr"]["w:b"];
          }
          rowObject.push(tempRow);
        }
        return [
          {"w:p": {
            "@w:rsidR": "00995B51",
            "@w:rsidRPr": "00722E63",
            "@w:rsidRDefault": "00995B51",
            "w:pPr": {
              "w:jc": {
                "@w:val": opts.align || tblOpts.tableAlign || "center"
              },
            },
            "#list": [rowObject]
          }}];
      }
      if(cell.type === 'image') {
        var image = _this._insertImage(cell.path, cell.opts, cell.type);
        var img = {
          "wp:inline": {
            "@distT": "0",
            "@distB": "0",
            "@distL": "0",
            "@distR": "0",

            "wp:extent": {"@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cx * Math.floor(12573.739))},

            "wp:effectExtent": {"@l": "19050", "@t": "0", "@r": "9525", "@b": "0"},

            "wp:docPr": {"@id": "1", "@name": "Picture 0", "@descr": "Picture 0"},

            "wp:cNvGraphicFramePr": {
              "a:graphicFrameLocks": {
                "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                "@noChangeAspect": "1"
              }
            },

            "a:graphic": {
              "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
              "a:graphicData": {
                "@uri": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                "pic:pic": {
                  "@xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                  "pic:nvPicPr": {
                    "pic:cNvPr": {"@id":image.image_id, "@name": "Picture 0"},
                    "pic:cNvPicPr":{}
                  },
                  "pic:blipFill": {
                    "a:blip": {"@r:embed": "rId"+image.rel_id, "@cstate": "print"},
                    "a:stretch": {
                      "a:fillRect": {}
                    }
                  },
                  "pic:spPr": {
                    "a:xfrm": {
                      "a:off": {"@x": "0", "@y": "0"},
                      "a:ext": {"@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cx * Math.floor(12573.739))}
                    },
                    "a:prstGeom": {
                      "@prst": "rect",
                      "a:avLst": {}
                    }
                  }
                }
              }
            }
          }
        }

        var ret = [
          {
            "w:p": {
              "@w:rsidR": "00995B51",
              "@w:rsidRPr": "00722E63",
              "@w:rsidRDefault": "00995B51",
              "w:pPr": {
                "w:jc": {
                  "@w:val": "center"
                },
              },
              "w:r": {
                "@w:rsidRPr": "00722E63",
                "w:rPr": {
                  "w:rFonts": {
                    "@w:ascii": "宋体",
                    "@w:hAnsi": "宋体"
                  }
                },
                "w:drawing": img

              }
            }
          }
        ]
        return ret;
      }
      if(!cell.type && cell.inline) {
        var opts = cell.opts || {};
        cell.values.forEach(function(row) {
          var tempRow = {};
          if(row.type && ( row.type === 'text' || row.type === 'number')) {
            tempRow = {
              "w:r": {
                "@w:rsidRPr": "00722E63",
                "w:rPr": {
                  "w:rFonts": {
                    "@w:ascii": row.opts.fontFamily || tblOpts.tableFontFamily || "宋体",
                    "@w:hAnsi": row.opts.fontFamily || tblOpts.tableFontFamily || "宋体"
                  },
                  "w:color": {
                    "@w:val": row.opts.color || tblOpts.tableColor || "000"
                  },
                  "w:b": {},
                  "w:sz": {
                    "@w:val": row.opts.sz || tblOpts.sz || "16"
                  },
                  "w:szCs": {
                    "@w:val": row.opts.sz || tblOpts.sz || "16"
                  }
                },
                "w:t": row.val
              }
            }
            if(!row.opts.b) {
              delete tempRow["w:r"]["w:rPr"]["w:b"];
            }
          }
          if(row.type && row.type === 'image') {
            var image = _this._insertImage(row.path, row.opts, row.type);
            var img = {
              "wp:inline": {
                "@distT": "0",
                "@distB": "0",
                "@distL": "0",
                "@distR": "0",

                "wp:extent": {"@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cx * Math.floor(12573.739))},

                "wp:effectExtent": {"@l": "19050", "@t": "0", "@r": "9525", "@b": "0"},

                "wp:docPr": {"@id": "1", "@name": "Picture 0", "@descr": "Picture 0"},

                "wp:cNvGraphicFramePr": {
                  "a:graphicFrameLocks": {
                    "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                    "@noChangeAspect": "1"
                  }
                },

                "a:graphic": {
                  "@xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main",
                  "a:graphicData": {
                    "@uri": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                    "pic:pic": {
                      "@xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
                      "pic:nvPicPr": {
                        "pic:cNvPr": {"@id":image.image_id, "@name": "Picture 0"},
                        "pic:cNvPicPr":{}
                      },
                      "pic:blipFill": {
                        "a:blip": {"@r:embed": "rId"+image.rel_id, "@cstate": "print"},
                        "a:stretch": {
                          "a:fillRect": {}
                        }
                      },
                      "pic:spPr": {
                        "a:xfrm": {
                          "a:off": {"@x": "0", "@y": "0"},
                          "a:ext": {"@cx": (image.options.cx * Math.floor(12573.739)), "@cy": (image.options.cx * Math.floor(12573.739))}
                        },
                        "a:prstGeom": {
                          "@prst": "rect",
                          "a:avLst": {}
                        }
                      }
                    }
                  }
                }
              }
            }
            tempRow = {
              "w:r": {
                "@w:rsidRPr": "00722E63",
                "w:rPr": {
                  "w:rFonts": {
                    "@w:ascii": "宋体",
                    "@w:hAnsi": "宋体"
                  }
                },
                "w:drawing": img
              }
            }
          }
          rowObject.push( tempRow);
        })
        return [
          {"w:p": {
            "@w:rsidR": "00995B51",
            "@w:rsidRPr": "00722E63",
            "@w:rsidRDefault": "00995B51",
            "w:pPr": {
              "w:jc": {
                "@w:val": opts.align || tblOpts.tableAlign || "center"
              },
            },
            "#list": [rowObject]
          }}];
      }
    })
    return content;
  },
  _insertImage: function (image_path, opt, image_format_type) {
    var image_type = (typeof image_format_type == 'string') ? image_format_type : 'png';
    var defWidth = 320;
    var defHeight = 200;

    if ( typeof image_path == 'string' ) {
      var ret_data = fast_image_size ( image_path );
      if ( ret_data.type == 'unknown' ) {
        var image_ext = path.extname ( image_path );

        switch ( image_ext ) {
          case '.bmp':
            image_type = 'bmp';
            break;

          case '.gif':
            image_type = 'gif';
            break;

          case '.jpg':
          case '.jpeg':
            image_type = 'jpeg';
            break;

          case '.emf':
            image_type = 'emf';
            break;

          case '.tiff':
            image_type = 'tiff';
            break;
        } // End of switch.

      } else {
        if ( ret_data.width ) {
          defWidth = ret_data.width;
        } // Endif.

        if ( ret_data.height ) {
          defHeight = ret_data.height;
        } // Endif.

        image_type = ret_data.type;
        if ( image_type == 'jpg' ) {
          image_type = 'jpeg';
        } // Endif.
      } // Endif.
    } // Endif.


    var imgObj = { image: image_path, options: opt || {} };

    if ( !imgObj.options.cx && defWidth ) {
      imgObj.options.cx = defWidth;
    } // Endif.

    if ( !imgObj.options.cy && defHeight ) {
      imgObj.options.cy = defHeight;
    } // Endif.
    var image_id = this.gen_private.type.msoffice.src_files_list.indexOf ( image_path );
    var image_rel_id = -1;

    if ( image_id >= 0 ) {
      for ( var j = 0, total_size_j = this.gen_private.type.msoffice.rels_app.length; j < total_size_j; j++ ) {
        if ( this.gen_private.type.msoffice.rels_app[j].target == ('media/image' + (image_id + 1) + '.' + image_type) ) {
          image_rel_id = j + 1;
        } // Endif.
      } // Endif.

    } else
    {
      image_id = this.gen_private.type.msoffice.src_files_list.length;
      this.gen_private.type.msoffice.src_files_list[image_id] = image_path;
      this.gen_private.plugs.intAddAnyResourceToParse ( 'word\\media\\image' + (image_id + 1) + '.' + image_type, (typeof image_path == 'string') ? 'file' : 'stream', image_path, null, false );
    } // Endif.

    if ( image_rel_id == -1 ) {
      image_rel_id = this.gen_private.type.msoffice.rels_app.length + 1;

      this.gen_private.type.msoffice.rels_app.push (
          {
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            target: 'media/image' + (image_id + 1) + '.' + image_type,
            clear: 'data'
          }
      );
    } // Endif.


    if ((opt || {}).link) {

      var link_rel_id = this.gen_private.type.msoffice.rels_app.length + 1;

      this.gen_private.type.msoffice.rels_app.push({
        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
        target: opt.link,
        targetMode: 'External'
      });

      imgObj.link_rel_id = link_rel_id;

    } // Endif.

    imgObj.image_id = image_id;
    imgObj.rel_id = image_rel_id;
    return imgObj;
  }
}
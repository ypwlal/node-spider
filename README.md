所有歌手 /discover/artist/cat?id=xx&initial={0, 65, 90}
A-Z 其他
歌手页面 /artist?id=xx
歌手 -> 所有专辑 /artist/album?id=xx
    专辑 -> 歌曲 /album?id=yyy
        comment
        歌曲 /song?id=zz
            comment

* create task // flatten
    - start
    - artist
    - artist/album
    - album
    - song

* split parse and process
    - save task // hundreds of thousands for songs
        - useless task
    - process task
    - speed different

* merge parse and process
    - inefficient

* pools
    - child_process
    - ua
    - spider
    - taskList

* error

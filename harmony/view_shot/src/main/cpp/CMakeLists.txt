cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB rnoh_view_shot_SRC CONFIGURE_DEPENDS *.cpp)
add_library(rnoh_view_shot SHARED ${rnoh_view_shot_SRC})
target_include_directories(rnoh_view_shot PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(rnoh_view_shot PUBLIC rnoh)
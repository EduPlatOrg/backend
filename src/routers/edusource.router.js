const express = require("express");
const {insertEdusource, getEdusourceByLink, insertEduValoration, getEdusourceByPromoterId, getLastResources, getValoration, updateValoration, deleteEduById, updateResource, searchEdusources, searchCategories, acceptRejectValoration, getAllResources, searchThemes, searchLevels, searchLangs, fixTypes, searchTypes, checkLink, getEdusourcebyId, searchEdusourcesMinReturn} = require('../model/edusource/edusource.model');
const { getUserbyId } = require("../model/user/user.model");

const router = express.Router();

router.all("/", (req, res, next) =>{
    //res.json({message: "return from Edusource router"});
    res.header('Access-Control-Allow-Origin', '*');
    next();
 });

//Create new edusource
router.post("/", async(req, res) => {
    const {title, resourceURL, promoterId, autors, languaje, discipline, theme, type, link, linktype, description, picture, licence, valorations, language, level, date} = req.body;

    const eduObj = {
        title: title?title:"",
        resourceURL: resourceURL?resourceURL:"",
        promoterId: promoterId?promoterId:"",
        autors: autors?autors:{},
        discipline: discipline?discipline:"other",
        level: level?level:"OTHER",
        languaje: languaje?languaje:"EN",
        theme: theme?theme:{"label":"other"},
        type: type?type:"lesson",
        link: link,
        linktype: linktype?linktype:"webpage",
        description: description?description:"",
        picture: {
            fileName: picture.fileName?picture.fileName:"",
            file: picture.file?picture.file:"",
            uploadTime: picture.uploadTime?Date(picture.uploadTime):Date.now(),
            type: picture.type?picture.type:"link"
        },
        licence: licence?licence:"CC",
        date: date?date:Date.now(),
        language:language,
        valorations: valorations?valorations:[] 
    }

    //Check link
    const checkedLink =  await checkLink(eduObj.resourceURL);
    //console.log(checkedLink.length, eduObj.resourceURL)
    if (checkedLink.length > 0){

        eduObj.resourceURL = eduObj.resourceURL + "-" + (checkedLink.length +1).toString();
    }
 
    try {
        const result = await insertEdusource(eduObj);
        //console.log("Insert Edusource Result",result);
        res.json({status: "success", message: "New Edusource created", result});
 
    } catch(err){
        console.log(err)
        let message = "Unable to create Educational Resource at the moment. Pleaset contact administrator"
        res.json({status:"error", message});
    }
 });

 router.delete("/", async(req,res)=>{
    const edusourceId = req.query.edusourceId;
    //console.log("BORRANDO ", edusourceId)
    try {
        const result = await deleteEduById(edusourceId)
        if (result){
            res.json({status: "success", message:"Resource deleted", result});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
        
    } catch (error) {
        res.json({status:"error", message:error.message});
        
    }
 })

 router.patch("/", async(req,res)=>{
    const frmData = req.body;
    try {
       
        const result = await updateResource(frmData);
        if (result){
            res.json({status: "success", result});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
     
    } catch (error) {
        console.log(error)
        res.json({status:"error", error});
    }
 })

 router.get ("/", async(req, res)=>{
    const id = req.query.id;
    try {
       
        const result = await getEdusourcebyId(id);
        if (result){
            res.json({status: "success", result});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
     
    } catch (error) {
        console.log(error)
        res.json({status:"error", error});
    }
 })


 
 router.post("/valoration", async(req, res)=>{
    const {edusourceId, senderId, comment, value} = req.body;
    //console.log(req.body);
    const valObj = {
        edusourceId: edusourceId,
        senderId: senderId,
        comment: comment,
        value: value,
        date: Date.now(),
        accepted: false
    }
    try {
        const result = await insertEduValoration(valObj);
        //console.log("Insert Edusource Valoration",result);
        res.json({status: "success", message: "New Valoration added", result});
 
    } catch(err){
        console.log(err)
        let message = "Unable to create Valoration at the moment. Pleaset contact administrator"
        res.json({status:"error", message});
    }

 })

 router.get("/valoration", async(req, res)=>{
    const {userId, edusourceId} = req.query;
    try {
        const result = await getValoration(userId, edusourceId);
        if (result){
            res.json({status: "success", result});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
     
    } catch (error) {
        res.json({status:"error", error});
    }
 })

 router.patch("/valoration", async(req, res)=>{
    const {senderId, edusourceId, value, comment } = req.body;
    try {
        const result = await updateValoration(senderId, edusourceId, value, comment);
        if (result){
            res.json({status: "success", result});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
     
    } catch (error) {
        console.log(error)
        res.json({status:"error", error});
    }
 })

 router.patch("/valorationMod", async(req,res)=>{
    const {accepted, rejected, edu_id, val_id}= req.body;
    try {
        const result = await acceptRejectValoration(accepted, rejected, edu_id, val_id);
        //console.log ("RESULT EN ROUTER",result)
        if (result){
            res.json({status: "success", result});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
     
    } catch (error) {
        console.log(error)
        res.json({status:"error", error});
    }
    
 })

 router.get("/bylink", async(req, res)=>{
    const resourceURL = req.query.link
    //console.log("BY LINK", resourceURL)
    try {
        const result = await getEdusourceByLink(resourceURL);
        if (result){
            if (result.valorations){
                for (let index = 0; index < result.valorations.length; index++) {
                    const user = await getUserbyId(result.valorations[index].senderId)
                    const newObj = {
                        _id: result.valorations[index]._id,
                        senderAvatar: user.picture,
                        senderUser: user.username,
                        comment: result.valorations[index].comment,
                        value: result.valorations[index].value,
                        date: Date(result.valorations[index].date),
                        accepted: Boolean(result.valorations[index].accepted),
                    }   
                    result.valorations[index]=newObj
                }
            }
            res.json({status: "success", result});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }
   
 })

 router.get("/sortedbypromoterid", async(req, res)=>{
    const promoterId = req.query.promoterId
    const page = req.query.page;
    //console.log("SortedByPromoterId", promoterId)
     try {
        const result = await getEdusourceByPromoterId(promoterId,page);
        if (result){
            var accepted = []
            var noAccepted = []
            //RECORREMOS EDUSOURCES
            for (let edu = 0; edu < result.length; edu++) {
                //console.log(result[edu].valorations)
                 if (result[edu].valorations.length>0){

                    for (let index = 0; index < result[edu].valorations.length; index++) {
                        const user = await getUserbyId(result[edu].valorations[index].senderId)
                        const newObj = {
                            val_id: result[edu].valorations[index]._id,
                            senderPicture: user.picture,
                            senderUser: user.username,
                            edu_id: result[edu]._id,
                            eduTitle: result[edu].title,
                            eduDescription: result[edu].description,
                            eduPicture: result[edu].picture,
                            comment: result[edu].valorations[index].comment,
                            value: result[edu].valorations[index].value,
                            date: Date(result[edu].valorations[index].date),
                            accepted: Boolean(result[edu].valorations[index].accepted),
                            rejected: Boolean(result[edu].valorations[index].rejected)
                        }   
                        if (result[edu].valorations[index].accepted)
                            accepted.push(newObj); 
                        if (!result[edu].valorations[index].accepted && !result[edu].valorations[index].rejected)
                            noAccepted.push(newObj);
                    }
                } 
            }
            

            res.json({status: "success", accepted, noAccepted});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
     } catch (error) {
        console.log(error)
        res.json({status:"error", error});
    } 
   
 })

 

 router.get("/bypromoter", async(req, res)=>{
    const promoterId = req.query.promoterId
    const page = req.query.page;
   // console.log("BY PROMOTER", promoterId)
    try {
        const result = await getEdusourceByPromoterId(promoterId, page);
        if (result){
            res.json({status: "success", result});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }
 })



 router.get("/last", async(req, res)=>{
    const page = req.query.page
    try {
        const result = await getAllResources(page);
        if (result){
            res.json({status: "success", data: result.data, total: result.total});
        }
        else {
            res.json({status: "error", message:"URI doesnt exist"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }
 })

 router.get("/search", async(req, res)=>{
    const terms = req.query.terms;
    const lang = req.query.lang;
    const category = req.query.category;
    const level = req.query.level;
    const themes = req.query.themes;
    const page = req.query.page
    //console.log(req.query);
    try {
        const result = await searchEdusources(terms, lang, category, level, themes, page);
        if (result){
            //console.log(result)
            res.json ({status:"success", data: result.data, total: result.total});
        }
        else {
            res.json({status: "success", result, message:"Nothing Found"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }   
})

router.get("/minsearch", async(req, res)=>{
    const terms = req.query.terms;
  
    //console.log(req.query);
    try {
        const result = await searchEdusourcesMinReturn(terms);
        if (result){
            
            res.json ({status:"success", data: result});
        }
        else {
            res.json({status: "success", result, message:"Nothing Found"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }   
})

router.get("/category", async(req, res)=>{
    const category = req.query.category;
    const page = req.query.page;
    //console.log(req.query);
    try {
        const result = await searchCategories(category, page);
        if (result){
            console.log("IN ROUTER /CATEGORY",result)
            res.json ({status:"success", data: result.data, total: result.total});
        }
        else {
            res.json({status: "success", result, message:"Nothing Found"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }   
})

router.get("/theme", async(req, res)=>{
    const theme = req.query.theme;
    //console.log(req.query);
    try {
        const result = await searchThemes(theme);
        if (result){
            //console.log(result)
            res.json ({status:"success", result});
        }
        else {
            res.json({status: "success", result, message:"Nothing Found"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }   
})

router.get("/level", async(req, res)=>{
    const level = req.query.level;
    const page = req.query.page;
    //console.log(req.query);
    try {
        const result = await searchLevels(level, page);
        if (result){
            //console.log(result)
            res.json ({status:"success", data: result.data, total: result.total});
            
        }
        else {
            res.json({status: "success", result, message:"Nothing Found"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }   
})

router.get("/language", async(req, res)=>{
    const language = req.query.language
    const page = req.query.page;
    //console.log(req.query);
    try {
        const result = await searchLangs(language,page);
        if (result){
            //console.log(result)
            res.json ({status:"success", data: result.data, total: result.total});
        }
        else {
            res.json({status: "success", result, message:"Nothing Found"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }   
})

router.get("/type", async(req, res)=>{
    const type = req.query.type
    const page = req.query.page;
    console.log(req.query);
    try {
        const result = await searchTypes(type,page);
        if (result){
            //console.log(result)
            res.json ({status:"success", data: result.data, total: result.total});
        }
        else {
            res.json({status: "success", result, message:"Nothing Found"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }   
})



router.get("/all", async(req,res)=>{
    try {
        const page = req.query.page;
        const result = await getAllResources(page);
        if (result){
            //console.log(result)
            res.json ({status:"success", result:result.data, total: result.total});
        }
        else {
            res.json({status: "success", result, message:"Nothing Found"})
        }
    } catch (error) {
        res.json({status:"error", error});
    }   
})

router.patch("/fixTypes", async(req, res)=>{
    try {
        const result = await fixTypes();
        if (result){
            //console.log(result)
            res.json ({status:"success", result});
        }
        else {
            res.json({status: "success", result, message:"Nothing Found"})
        }
     } catch (error) {
        res.json({status:"error", error});
    }   
})

module.exports = router;
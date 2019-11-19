<base href="<%		   
Response.Write( Replace(Request.ServerVariables("SCRIPT_NAME"), "admin/index.aspx", "") )
%>">
<%		   
Response.WriteFile ("../index.html")
%>